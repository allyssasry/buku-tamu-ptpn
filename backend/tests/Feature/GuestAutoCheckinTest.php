<?php

namespace Tests\Feature;

use App\Http\Controllers\GuestController;
use App\Models\Guest;
use App\Models\IdentityDeposit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestAutoCheckinTest extends TestCase
{
    use RefreshDatabase;

    private string $dummyPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    public function test_public_guest_submission_without_card_or_floor_or_id_number_auto_assigns_card_and_security_sets_floor(): void
    {
        // Public guest submits form without destination_floor, identity_number, or card_number
        $response = $this->postJson('/api/guests', [
            'name' => 'Budi Santoso',
            'institution' => 'PT Mitra Sejati',
            'phone' => '081234567890',
            'purpose' => 'Meeting Vendor',
            'meeting_with' => 'Kepala Divisi TI',
            'destination_division' => 'Divisi Manajemen Aset',
            'identity_type' => 'KTP',
            'category' => 'tamu',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ]);

        $response->assertStatus(201);
        $guest = Guest::where('name', 'Budi Santoso')->firstOrFail();

        $this->assertEquals('Menunggu Verifikasi', $guest->status);
        $this->assertEquals('001', $guest->card_number); // Auto-assigned card 001
        $this->assertEquals('-', $guest->destination_floor); // Blank before security sets it
        $this->assertNull($guest->identity_number);
        $this->assertNull($guest->verified_at);

        // Security officer at floor 11 verifies the guest and sets floor to Lantai 11
        $security = User::create([
            'name' => 'Petugas Security Lt 11',
            'email' => 'sec11@example.com',
            'password' => bcrypt('password'),
            'role' => 'security',
        ]);

        $verifyRes = $this->actingAs($security)
            ->postJson("/api/guests/{$guest->id}/verify", [
                'status' => 'Terverifikasi',
                'destination_floor' => 'Lantai 11',
                'deposit_id' => true,
            ]);

        $verifyRes->assertStatus(200);
        $guest->refresh();
        $this->assertEquals('Terverifikasi', $guest->status);
        $this->assertEquals('Lantai 11', $guest->destination_floor);
        $this->assertEquals('001', $guest->card_number);
        $this->assertNotNull($guest->verified_at);
        $this->assertEquals($security->id, $guest->verified_by);
    }

    public function test_card_allocation_loops_and_continues_forward_when_intermediate_card_returned(): void
    {
        // Scenario: cards 1, 2, 3, 4 are assigned
        for ($i = 1; $i <= 4; $i++) {
            $this->postJson('/api/guests', [
                'name' => "Tamu {$i}",
                'institution' => 'Instansi Tes',
                'phone' => "0812345678{$i}",
                'purpose' => 'Rapat',
                'meeting_with' => 'Staff',
                'destination_division' => 'Divisi Manajemen Aset',
                'identity_type' => 'KTP',
                'category' => 'tamu',
                'guest_photo' => $this->dummyPhoto,
                'consent' => true,
            ])->assertStatus(201);
        }

        $guest3 = Guest::where('name', 'Tamu 3')->firstOrFail();
        $this->assertEquals('003', $guest3->card_number);

        // Tamu 3 checks out (returns card 3)
        $security = User::create([
            'name' => 'Security Officer',
            'email' => 'sec@example.com',
            'password' => bcrypt('password'),
            'role' => 'security',
        ]);

        $this->actingAs($security)
            ->postJson("/api/guests/{$guest3->id}/checkout")
            ->assertStatus(200);

        // Next guest registers: should NOT pick card 3, but CONTINUE forward to card 5!
        $res5 = $this->postJson('/api/guests', [
            'name' => 'Tamu 5',
            'institution' => 'Instansi Tes',
            'phone' => '081234567899',
            'purpose' => 'Rapat',
            'meeting_with' => 'Staff',
            'destination_division' => 'Divisi Manajemen Aset',
            'identity_type' => 'KTP',
            'category' => 'tamu',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ]);

        $res5->assertStatus(201);
        $guest5 = Guest::where('name', 'Tamu 5')->firstOrFail();
        $this->assertEquals('005', $guest5->card_number);
    }
}
