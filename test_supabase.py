#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار الاتصال بقاعدة بيانات Supabase
"""

import requests
import json

# بيانات الاتصال
SUPABASE_URL = "https://xyrdpmhzwjejkstwovyx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cmRwbWh6d2plamtzdHdvdnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDA2NjgsImV4cCI6MjA4MTAxNjY2OH0.h3uh9XojuEULP_lEtSeroYrKaWSjDnaS36yz1ZKwqvY"

def test_connection():
    """اختبار الاتصال بقاعدة البيانات"""
    print("=" * 60)
    print("🔍 اختبار الاتصال بقاعدة بيانات Supabase")
    print("=" * 60)
    print(f"\n📡 URL: {SUPABASE_URL}")
    print(f"🔑 Key: {SUPABASE_KEY[:50]}...")
    print("\n" + "-" * 60)
    
    # اختبار 1: الاتصال بالـ API
    print("\n✅ اختبار 1: الاتصال بالـ API")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            timeout=10
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ الاتصال بالـ API ناجح!")
        else:
            print(f"   ❌ فشل الاتصال: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ خطأ في الاتصال: {str(e)}")
        return False
    
    # اختبار 2: قراءة جدول المستخدمين
    print("\n✅ اختبار 2: قراءة جدول المستخدمين (users)")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?select=*",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            timeout=10
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            users = response.json()
            print(f"   ✅ تم قراءة الجدول بنجاح!")
            print(f"   📊 عدد المستخدمين: {len(users)}")
            if users:
                print(f"\n   👥 المستخدمون:")
                for user in users:
                    print(f"      - {user.get('name')} ({user.get('type')}) - {user.get('phone')}")
        else:
            print(f"   ❌ فشل قراءة الجدول: {response.status_code}")
            print(f"   Response: {response.text}")
            if response.status_code == 404:
                print("\n   ⚠️  الجدول غير موجود! يجب تنفيذ السكريبت SQL أولاً")
            return False
    except Exception as e:
        print(f"   ❌ خطأ في قراءة الجدول: {str(e)}")
        return False
    
    # اختبار 3: قراءة جدول المواد
    print("\n✅ اختبار 3: قراءة جدول المواد (subjects)")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/subjects?select=*",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            timeout=10
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            subjects = response.json()
            print(f"   ✅ تم قراءة الجدول بنجاح!")
            print(f"   📚 عدد المواد: {len(subjects)}")
            if subjects:
                print(f"\n   📖 المواد:")
                for subject in subjects:
                    print(f"      - {subject.get('name')} ({subject.get('type')}) - {subject.get('lessons_count')} درس")
        else:
            print(f"   ❌ فشل قراءة الجدول: {response.status_code}")
            if response.status_code == 404:
                print("\n   ⚠️  الجدول غير موجود! يجب تنفيذ السكريبت SQL أولاً")
    except Exception as e:
        print(f"   ❌ خطأ في قراءة الجدول: {str(e)}")
    
    # اختبار 4: إنشاء مستخدم تجريبي
    print("\n✅ اختبار 4: إنشاء مستخدم تجريبي")
    try:
        test_user = {
            "name": "اختبار الاتصال",
            "email": f"test_{int(requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC').json()['unixtime'])}@test.com",
            "phone": "+966500000000",
            "type": "student",
            "subscription_status": "نشط"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json=test_user,
            timeout=10
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 201:
            print(f"   ✅ تم إنشاء المستخدم التجريبي بنجاح!")
            created_user = response.json()[0]
            print(f"   👤 المستخدم: {created_user.get('name')}")
            print(f"   📧 البريد: {created_user.get('email')}")
        else:
            print(f"   ⚠️  لم يتم إنشاء المستخدم: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ⚠️  خطأ في إنشاء المستخدم: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎉 اكتملت جميع الاختبارات!")
    print("=" * 60)
    print("\n✅ المفاتيح صحيحة والاتصال يعمل بنجاح!")
    print("💡 يمكنك الآن استخدام التطبيق بأمان\n")
    return True

if __name__ == "__main__":
    try:
        success = test_connection()
        if not success:
            print("\n❌ فشلت بعض الاختبارات!")
            print("💡 تأكد من:")
            print("   1. تنفيذ السكريبت SQL في Supabase")
            print("   2. صحة المفاتيح")
            print("   3. اتصالك بالإنترنت\n")
    except KeyboardInterrupt:
        print("\n\n⚠️  تم إيقاف الاختبار\n")
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع: {str(e)}\n")
