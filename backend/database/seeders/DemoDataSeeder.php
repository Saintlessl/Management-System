<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Label;
use App\Models\ProjectMember;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/*
  Demo content for local development and screenshots.

  Creates a realistic workspace around existing users: four projects in
  different lifecycle states, tasks spread across every status and priority,
  members, labels, a few comments, and notifications. Idempotent per run — it
  skips seeding when the projects table already has content.
*/
class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (Project::exists()) {
            $this->command?->info('DemoDataSeeder skipped: projects already exist.');

            return;
        }

        $users = User::query()->orderBy('id')->get();
        $admin = $users->first();
        if (! $admin) {
            $this->command?->warn('DemoDataSeeder skipped: no users. Run SuperAdminSeeder first.');

            return;
        }
        $others = $users->skip(1);

        $today = now()->startOfDay();

        $projectBlueprints = [
            [
                'name' => 'Website Redesign',
                'description' => 'Perombakan total situs korporat: identitas baru, CMS baru, dan audit performa.',
                'status' => 'active',
                'start_date' => $today->copy()->subDays(40),
                'deadline' => $today->copy()->addDays(20),
                'manager_index' => 0,
                'labels' => [['Design', '#2563eb'], ['Frontend', '#059669'], ['Content', '#d97706']],
            ],
            [
                'name' => 'Internal Marketing Platform',
                'description' => 'Platform internal untuk perencanaan kampanye dan pelaporan aset marketing.',
                'status' => 'planning',
                'start_date' => $today->copy()->addDays(5),
                'deadline' => $today->copy()->addDays(60),
                'manager_index' => 1,
                'labels' => [['Backend', '#7c3aed'], ['Infra', '#0891b2']],
            ],
            [
                'name' => 'Mobile App v2',
                'description' => 'Rilis mayor aplikasi mobile: offline mode, push notification, dan desain ulang onboarding.',
                'status' => 'active',
                'start_date' => $today->copy()->subDays(70),
                'deadline' => $today->copy()->subDays(3), // overdue on purpose
                'manager_index' => 0,
                'labels' => [['Mobile', '#db2777'], ['QA', '#65a30d']],
            ],
            [
                'name' => 'Data Migration 2026',
                'description' => 'Migrasi arsip data legacy ke gudang data baru beserta validasi integritas.',
                'status' => 'on_hold',
                'start_date' => $today->copy()->subDays(25),
                'deadline' => $today->copy()->addDays(45),
                'manager_index' => min(2, $users->count() - 1),
                'labels' => [['Backend', '#7c3aed'], ['Data', '#ca8a04']],
            ],
        ];

        // Task templates: [title, status, priority, dueOffsetDays, description]
        $taskTemplates = [
            ['Audit konten halaman lama', 'done', 'medium', -12, 'Inventarisasi seluruh halaman aktif dan tandai yang akan dipensiunkan.'],
            ['Desain sistem warna baru', 'done', 'high', -8, 'Palet primer/sekunder plus token untuk tim frontend.'],
            ['Setup repository & CI pipeline', 'done', 'high', -10, 'Pipeline lint, test, dan build preview otomatis per PR.'],
            ['Wireframe halaman utama', 'review', 'high', 2, 'Tiga alternatif layout hero dengan hierarki konten berbeda.'],
            ['Riset kompetitor visual', 'review', 'low', 4, 'Kumpulan referensi dari lima kompetitor utama.'],
            ['Implementasi komponen navigasi', 'in_progress', 'high', 6, 'Navbar responsif dengan dropdown dan mode mobile drawer.'],
            ['Migrasi artikel ke CMS baru', 'in_progress', 'medium', 9, 'Skrip impor bertahap dengan peta redirect 301.'],
            ['Uji aksesibilitas WCAG AA', 'todo', 'critical', 11, 'Audit kontras, fokus keyboard, dan label form di seluruh halaman.'],
            ['Optimasi gambar & lazy loading', 'todo', 'medium', 13, 'Konversi ke format modern dan strategi preload LCP.'],
            ['Draf copywriting halaman produk', 'backlog', 'low', 18, 'Naskah awal untuk tiga halaman produk prioritas.'],
            ['Arsitektur modul kampanye', 'in_progress', 'high', 7, 'ERD awal, batas modul, dan kontrak API antar layanan.'],
            ['Spike: pemilihan headless CMS', 'todo', 'medium', 12, 'Evaluasi tiga kandidat dengan kriteria biaya dan DX.'],
            ['Rancang dashboard pelaporan', 'backlog', 'medium', 25, 'Sketch metrik inti dan sumber datanya.'],
            ['Prototype offline mode', 'in_progress', 'critical', -2, 'Sinkronisasi antrian lokal saat koneksi kembali tersedia.'],
            ['Integrasi push notification', 'todo', 'high', 5, 'Registrasi token perangkat dan template notifikasi.'],
            ['Redesign alur onboarding', 'review', 'high', 1, 'Alur empat langkah dengan progress indicator.'],
            ['Regression test rilis beta', 'backlog', 'critical', -1, 'Checklist regression dari laporan bug build sebelumnya.'],
            ['Perbaikan crash di layar login', 'done', 'critical', -15, 'Null-safety pada handler deep link penyebab crash.'],
            ['Pemetaan skema data legacy', 'done', 'high', -20, 'Dokumentasi tabel sumber dan aturan transformasi.'],
            ['Validasi integritas pasca-migrasi', 'todo', 'critical', 14, 'Rekonsiliasi jumlah baris dan checksum per tabel.'],
            ['Skrip rollback migrasi', 'todo', 'high', 16, 'Prosedur pembalikan aman dengan titik checkpoint.'],
        ];

        foreach ($projectBlueprints as $index => $blueprint) {
            $manager = $users[$blueprint['manager_index']] ?? $admin;

            $project = Project::create([
                'name' => $blueprint['name'],
                'description' => $blueprint['description'],
                'status' => $blueprint['status'],
                'start_date' => $blueprint['start_date'],
                'deadline' => $blueprint['deadline'],
                'project_manager_id' => $manager->id,
                'created_by' => $admin->id,
            ]);

            // Manager as project manager, everyone else as members.
            ProjectMember::create([
                'project_id' => $project->id,
                'user_id' => $manager->id,
                'project_role' => 'manager',
                'joined_at' => now(),
            ]);
            $others
                ->reject(fn (User $user) => $user->id === $manager->id)
                ->each(fn (User $user) => ProjectMember::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'project_role' => 'member',
                    'joined_at' => now(),
                ]));

            $labelIds = [];
            foreach ($blueprint['labels'] as [$labelName, $color]) {
                $labelIds[] = Label::create([
                    'name' => $labelName,
                    'color' => $color,
                    'project_id' => $project->id,
                ])->id;
            }

            $position = 0;
            foreach ($taskTemplates as $offset => [$title, $status, $priority, $dueOffset, $description]) {
                // Spread the template pool across projects so each board is varied.
                if (($offset + $index) % 3 !== 0) {
                    continue;
                }

                $assignee = $offset % 2 === 0 ? $manager : ($others->get($offset % max(1, $others->count())) ?? $admin);
                Task::create([
                    'project_id' => $project->id,
                    'title' => $title,
                    'description' => $description,
                    'status' => $status,
                    'priority' => $priority,
                    'assignee_id' => $assignee->id,
                    'reporter_id' => $admin->id,
                    'deadline' => $today->copy()->addDays($dueOffset),
                    'position' => ++$position,
                    'version' => 1,
                ]);
            }

            // A short comment thread on the first task of each project.
            $firstTask = $project->tasks()->orderBy('id')->first();
            if ($firstTask) {
                Comment::create([
                    'task_id' => $firstTask->id,
                    'user_id' => $admin->id,
                    'body' => "Kickoff untuk \"{$firstTask->title}\" — silakan review deskripsinya sebelum mulai.",
                ]);
                if ($others->isNotEmpty()) {
                    Comment::create([
                        'task_id' => $firstTask->id,
                        'user_id' => $others->first()->id,
                        'parent_id' => null,
                        'body' => 'Sudah dibaca, timeline-nya masuk akal. Aku mulai besok pagi.',
                    ]);
                }
            }

            // Notification for the admin account so the bell badge is alive.
            $admin->notify(new class($project) extends \Illuminate\Notifications\Notification {
                public function __construct(private Project $project)
                {
                }

                public function via($notifiable): array
                {
                    return ['database'];
                }

                public function toArray($notifiable): array
                {
                    return [
                        'event' => 'project_assigned',
                        'excerpt' => "Anda ditambahkan ke proyek {$this->project->name}.",
                    ];
                }
            });
        }

        // Dashboard responses are cached for two minutes; clear so the new
        // numbers appear immediately after seeding.
        Cache::flush();
    }
}
