<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return redirect(config('app.frontend_url', config('app.url')).'/login');
})->name('login');
