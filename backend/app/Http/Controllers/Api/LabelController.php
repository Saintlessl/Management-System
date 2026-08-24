<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Label;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LabelController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['success' => true, 'message' => 'Label berhasil dimuat.', 'data' => $project->labels()->orderBy('name')->get()]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('labels')->where('project_id', $project->id)], 'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/']]);
        $label = $project->labels()->create($data);

        return response()->json(['success' => true, 'message' => 'Label berhasil dibuat.', 'data' => $label], 201);
    }

    public function update(Request $request, Label $label): JsonResponse
    {
        $this->authorize('update', $label->project);
        $data = $request->validate(['name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('labels')->where('project_id', $label->project_id)->ignore($label)], 'color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/']]);
        $label->update($data);

        return response()->json(['success' => true, 'message' => 'Label berhasil diperbarui.', 'data' => $label]);
    }

    public function destroy(Label $label): JsonResponse
    {
        $this->authorize('update', $label->project);
        $label->delete();

        return response()->json(['success' => true, 'message' => 'Label berhasil dihapus.', 'data' => null]);
    }
}
