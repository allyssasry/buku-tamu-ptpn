const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdnd5aW1rdHZmZm1oYWRhcmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTkwNjEsImV4cCI6MjEwMzg3NTA2MX0.Vzt-t6CezoWwuxPLm4IhTwyrz8yTQmJeudnnOFgznrs';
const headers = { apikey: key, Authorization: 'Bearer ' + key };

async function check() {
  const tables = ['mcu_donor_darah', 'mcu_mini_mcu_records', 'mcu_records', 'mcu_karyawan_records'];
  for (const t of tables) {
    const res = await fetch(`https://eovwyimktvffmhadarjl.supabase.co/rest/v1/${t}?select=*&limit=100`, { headers });
    const data = await res.json();
    if (Array.isArray(data)) {
      const allyssa = data.filter(d => (d.nik === '678976' || (d.nama_lengkap && d.nama_lengkap.toLowerCase().includes('allyssa'))));
      console.log(`=== ${t} === (total ${data.length}, allyssa: ${allyssa.length})`);
      if (allyssa.length > 0) {
        console.log(allyssa.map(d => ({ id: d.id, name: d.nama_lengkap, nik: d.nik, departemen: d.departemen, entitas: d.entitas, divisi: d.divisi })));
      }
    } else {
      console.log(`=== ${t} === (error)`, data);
    }
  }
}
check();
