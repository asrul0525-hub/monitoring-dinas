<?php

use App\Models\User;

it('tidak menyediakan registrasi', fn () => $this->get('/register')->assertNotFound());

it('tidak menyediakan reset password', fn () => $this->get('/forgot-password')->assertNotFound());

it('mengarahkan tamu ke login', fn () => $this->get('/')->assertRedirect('/login'));

it('halaman login merender komponen Auth/Login dengan branding RADAR HSU', function () {
    $this->get('/login')
        ->assertOk()
        ->assertSee('RADAR HSU');
});

it('admin bisa login dan masuk dashboard', function () {
    $user = User::factory()->create();
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/');
});
