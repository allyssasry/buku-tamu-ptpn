<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\IdentityDeposit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestAutoCheckinTest extends TestCase
{
    use RefreshDatabase;

    private string $dummyPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    public function test_public_magang_submission_auto_checkins_and_auto_deposits_id(): void
    {
        $response = $this->postJson('/api/guests', [
            'name' => 'isaa',
            'category' => 'magang',
            'destination_division' => 'Divisi Manajemen Aset',
            'card_number' => '001',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('guests', [
            'name' => 'isaa',
            'category' => 'magang',
            'card_number' => '001',
            'status' => 'Sedang Berkunjung',
        ]);

        $guest = Guest::where('name', 'isaa')->firstOrFail();
        $this->assertNotNull($guest->check_in_at);
        $this->assertNotNull($guest->verified_at);

        $this->assertDatabaseHas('identity_deposits', [
            'guest_id' => $guest->id,
            'status' => 'Dititipkan',
            'received_by' => null,
        ]);
    }

    public function test_tamu_and_magang_card_pools_are_independent_and_checkout_frees_card_and_returns_id(): void
    {
        // Magang takes card 001
        $this->postJson('/api/guests', [
            'name' => 'Anak Magang Satu',
            'category' => 'magang',
            'destination_division' => 'Divisi Manajemen Aset',
            'card_number' => '001',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ])->assertStatus(201);

        // Tamu Umum can also take card 001 without collision
        $this->postJson('/api/guests', [
            'name' => 'Tamu Umum Satu',
            'institution' => 'PT Mitra Sejati',
            'phone' => '08123456789',
            'purpose' => 'Rapat Koordinasi',
            'meeting_with' => 'Kepala Divisi',
            'destination_division' => 'Divisi Manajemen Aset',
            'destination_floor' => 'Lantai 2',
            'identity_type' => 'KTP',
            'category' => 'tamu',
            'card_number' => '001',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ])->assertStatus(201);

        // Second Magang using active Magang card 001 fails with 422
        $this->postJson('/api/guests', [
            'name' => 'Anak Magang Dua',
            'category' => 'magang',
            'destination_division' => 'Divisi Manajemen Aset',
            'card_number' => '001',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ])->assertStatus(422);

        // Security checks out Magang Satu -> card 001 freed and ID returned
        $security = User::create([
            'name' => 'Security Officer',
            'email' => 'sec@example.com',
            'password' => bcrypt('password'),
            'role' => 'security',
        ]);

        $magangGuest = Guest::where('name', 'Anak Magang Satu')->firstOrFail();

        $this->actingAs($security)
            ->postJson("/api/guests/{$magangGuest->id}/checkout")
            ->assertStatus(200);

        $this->assertDatabaseHas('guests', [
            'id' => $magangGuest->id,
            'status' => 'Sudah Keluar',
        ]);

        $this->assertDatabaseHas('identity_deposits', [
            'guest_id' => $magangGuest->id,
            'status' => 'Sudah Dikembalikan',
            'returned_by' => $security->id,
        ]);

        // Card 001 is now available for Anak Magang Dua
        $this->postJson('/api/guests', [
            'name' => 'Anak Magang Dua',
            'category' => 'magang',
            'destination_division' => 'Divisi Manajemen Aset',
            'card_number' => '001',
            'guest_photo' => $this->dummyPhoto,
            'consent' => true,
        ])->assertStatus(201);
    }
}
