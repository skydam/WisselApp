#!/usr/bin/env python3
"""
Quick Password Reset for WisselApp using Python
This works without needing to rebuild Node modules
"""

import sqlite3
import hashlib
import os
import sys

def bcrypt_hash(password):
    """
    Simplified password hashing compatible with bcryptjs
    Note: For proper bcrypt, we'd use the bcrypt library
    For now, we'll use a temporary password that you can change via Clerk
    """
    # Generate a bcrypt-compatible hash using Python's bcrypt if available
    try:
        import bcrypt
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except ImportError:
        print("⚠️  bcrypt not installed. Installing...")
        os.system('pip3 install bcrypt > /dev/null 2>&1')
        import bcrypt
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

def main():
    print("🏒 WisselApp Password Reset Tool (Python)\n")

    email = "jvharten@gmail.com"
    new_password = "hockey2024"

    print(f"Resetting password for: {email}")
    print(f"New password: {new_password}\n")

    # Connect to database
    try:
        conn = sqlite3.connect('wisselapp.db')
        cursor = conn.cursor()
        print("✅ Connected to database\n")

        # Check if user exists
        cursor.execute("SELECT id, email FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            print(f"❌ User '{email}' not found in database")
            return

        print(f"✅ Found user: {user[1]}\n")

        # Hash the password
        print("🔐 Hashing password...")
        hashed_password = bcrypt_hash(new_password)

        # Update database
        print("💾 Updating database...")
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_password, email))
        conn.commit()

        if cursor.rowcount == 1:
            print("\n✅ Password successfully reset!\n")
            print("You can now log in with:")
            print(f"   Email: {email}")
            print(f"   Password: {new_password}\n")
            print("🚀 Start server with: npm start")
            print("🌐 Then visit: http://localhost:3000\n")
        else:
            print("❌ Failed to update password")

        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
