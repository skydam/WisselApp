#!/usr/bin/env node

/**
 * Password Reset Script for WisselApp
 *
 * This script allows you to reset a user's password directly in the database.
 * Usage: node reset-password.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('🏒 WisselApp Password Reset Tool\n');

    try {
        // Connect to database
        const db = new Database('wisselapp.db');
        console.log('✅ Connected to database\n');

        // List existing users
        const users = db.prepare('SELECT id, email, created_at FROM users').all();

        if (users.length === 0) {
            console.log('❌ No users found in database');
            rl.close();
            return;
        }

        console.log('Existing users:');
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} (created: ${user.created_at})`);
        });
        console.log('');

        // Get email from user
        const email = await question('Enter email address to reset: ');

        if (!email) {
            console.log('❌ Email is required');
            rl.close();
            return;
        }

        // Check if user exists
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            rl.close();
            return;
        }

        console.log(`\n✅ Found user: ${user.email}`);

        // Get new password
        const newPassword = await question('Enter new password (min 6 characters): ');

        if (!newPassword || newPassword.length < 6) {
            console.log('❌ Password must be at least 6 characters');
            rl.close();
            return;
        }

        // Confirm password
        const confirmPassword = await question('Confirm new password: ');

        if (newPassword !== confirmPassword) {
            console.log('❌ Passwords do not match');
            rl.close();
            return;
        }

        // Hash the new password
        console.log('\n🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update database
        console.log('💾 Updating database...');
        const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
        const result = stmt.run(hashedPassword, email.toLowerCase());

        if (result.changes === 1) {
            console.log('\n✅ Password successfully reset!');
            console.log(`\nYou can now log in with:`);
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${newPassword}`);
            console.log('\n🚀 Open http://localhost:3000 to log in');
        } else {
            console.log('❌ Failed to update password');
        }

        db.close();
        rl.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

main();
