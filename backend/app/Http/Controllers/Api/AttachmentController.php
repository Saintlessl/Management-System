<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attachment\UploadAttachmentRequest;
use App\Http\Resources\AttachmentResource;
use App\Models\Attachment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return response()->json(['success' => true, 'message' => 'Attachment berhasil dimuat.', 'data' => AttachmentResource::collection($task->attachments()->with('uploader')->latest()->get())]);
    }

    public function store(UploadAttachmentRequest $request, Task $task): JsonResponse
    {
        $this->authorize('upload', [Attachment::class, $task]);
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $storedName = Str::uuid().'.'.$extension;
        $path = $file->storeAs("attachments/{$task->project_id}/{$task->id}", $storedName, 'local');
        $attachment = $task->attachments()->create([
            'uploaded_by' => $request->user()->id,
            'original_name' => basename($file->getClientOriginalName()),
            'stored_name' => $storedName,
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'size' => $file->getSize(),
            'path' => $path,
        ]);

        return response()->json(['success' => true, 'message' => 'Attachment berhasil diunggah.', 'data' => new AttachmentResource($attachment->load('uploader'))], 201);
    }

    public function download(Attachment $attachment): StreamedResponse
    {
        $this->authorize('download', $attachment);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404);

        return Storage::disk('local')->download($attachment->path, $attachment->original_name, ['Content-Type' => $attachment->mime_type]);
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        $this->authorize('delete', $attachment);
        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        return response()->json(['success' => true, 'message' => 'Attachment berhasil dihapus.', 'data' => null]);
    }
}
