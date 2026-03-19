#!/usr/bin/env python3
"""
ThinkSmart Portal API Client
Example implementation for querying the ThinkSmart driving school portal
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

class ThinkSmartClient:
    def __init__(self, base_url: str = "https://www.thinksmartsoftwareuk.com/customer_portal_backend/"):
        self.base_url = base_url
        self.session = requests.Session()
        self.authenticated = False
        
    def login(self, username: str, password: str) -> bool:
        """Authenticate with the ThinkSmart portal"""
        try:
            response = self.session.post(
                f"{self.base_url}login",
                json={"username": username, "password": password}
            )
            if response.status_code == 200:
                self.authenticated = True
                return True
            return False
        except Exception as e:
            print(f"Login failed: {e}")
            return False
    
    def get_class_sessions(self) -> List[Dict]:
        """Retrieve all class sessions"""
        if not self.authenticated:
            raise Exception("Not authenticated")
        
        response = self.session.post(f"{self.base_url}get_class_sessions")
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_enrollments(self) -> List[Dict]:
        """Get student enrollment information"""
        if not self.authenticated:
            raise Exception("Not authenticated")
        
        response = self.session.post(f"{self.base_url}get_enrollments")
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_payment_details(self) -> Dict:
        """Get payment and balance information"""
        if not self.authenticated:
            raise Exception("Not authenticated")
        
        response = self.session.post(f"{self.base_url}get_payment_details")
        if response.status_code == 200:
            return response.json()
        return {}
    
    def get_upcoming_payments(self) -> List[Dict]:
        """Get scheduled upcoming payments"""
        if not self.authenticated:
            raise Exception("Not authenticated")
        
        response = self.session.post(f"{self.base_url}get_upcoming_payments")
        if response.status_code == 200:
            return response.json()
        return []

class ThinkSmartQueryEngine:
    def __init__(self, client: ThinkSmartClient):
        self.client = client
    
    def get_next_lesson_for_student(self, student_name: str) -> Optional[Dict]:
        """Get the next lesson for a specific student"""
        sessions = self.client.get_class_sessions()
        now = datetime.now()
        
        for session in sessions:
            if student_name.lower() in session.get('student_name', '').lower():
                session_date = self._parse_datetime(session.get('date', ''), session.get('time', ''))
                if session_date and session_date > now:
                    return session
        return None
    
    def get_next_lesson_all_students(self) -> List[Dict]:
        """Get next upcoming lessons for all students"""
        sessions = self.client.get_class_sessions()
        now = datetime.now()
        upcoming_sessions = []
        
        for session in sessions:
            session_date = self._parse_datetime(session.get('date', ''), session.get('time', ''))
            if session_date and session_date > now:
                upcoming_sessions.append(session)
        
        # Sort by date
        upcoming_sessions.sort(key=lambda x: self._parse_datetime(x.get('date', ''), x.get('time', '')))
        return upcoming_sessions[:5]  # Return next 5 lessons
    
    def get_payment_status(self) -> Dict:
        """Get current payment status and balance"""
        payment_details = self.client.get_payment_details()
        balance_history = self.client.get_balance_history()
        upcoming_payments = self.client.get_upcoming_payments()
        
        return {
            'current_balance': payment_details.get('balance', 0),
            'total_paid': payment_details.get('total_paid', 0),
            'next_payment': upcoming_payments[0] if upcoming_payments else None,
            'payment_status': 'paid_up' if payment_details.get('balance', 0) <= 0 else 'balance_due'
        }
    
    def get_lesson_instructor(self, student_name: str, date: str = None) -> Optional[str]:
        """Get instructor for student's lesson (optionally on specific date)"""
        sessions = self.client.get_class_sessions()
        
        for session in sessions:
            if student_name.lower() in session.get('student_name', '').lower():
                if date is None or session.get('date', '') == date:
                    return session.get('instructor_name', '')
        return None
    
    def _parse_datetime(self, date_str: str, time_str: str) -> Optional[datetime]:
        """Parse date and time strings into datetime object"""
        try:
            # Adjust parsing based on actual date format from API
            date_part = datetime.strptime(date_str, '%Y-%m-%d').date()
            time_part = datetime.strptime(time_str, '%H:%M').time()
            return datetime.combine(date_part, time_part)
        except:
            return None

# Example usage functions
def answer_next_lesson_question(client: ThinkSmartClient, student_name: str = None) -> str:
    """Answer 'What lesson is next?' question"""
    engine = ThinkSmartQueryEngine(client)
    
    if student_name:
        lesson = engine.get_next_lesson_for_student(student_name)
        if lesson:
            return f"{student_name}'s next lesson is on {lesson.get('date')} at {lesson.get('time')} with {lesson.get('instructor_name', 'TBD')}"
        else:
            return f"No upcoming lessons found for {student_name}"
    else:
        lessons = engine.get_next_lesson_all_students()
        if lessons:
            response = "Upcoming lessons:\n"
            for lesson in lessons[:3]:
                response += f"- {lesson.get('student_name')}: {lesson.get('date')} at {lesson.get('time')} with {lesson.get('instructor_name', 'TBD')}\n"
            return response
        else:
            return "No upcoming lessons found"

def answer_payment_question(client: ThinkSmartClient) -> str:
    """Answer payment-related questions"""
    engine = ThinkSmartQueryEngine(client)
    status = engine.get_payment_status()
    
    response = f"Current balance: £{status['current_balance']}\n"
    response += f"Total paid: £{status['total_paid']}\n"
    
    if status['payment_status'] == 'paid_up':
        response += "Account is fully paid up ✓"
    else:
        response += "Balance due"
        if status['next_payment']:
            next_payment = status['next_payment']
            response += f"\nNext payment: £{next_payment.get('amount')} due {next_payment.get('date')}"
    
    return response

def answer_instructor_question(client: ThinkSmartClient, student_name: str) -> str:
    """Answer 'Who is [student]'s lesson with?' question"""
    engine = ThinkSmartQueryEngine(client)
    
    # Check tonight's lesson
    tonight = datetime.now().strftime('%Y-%m-%d')
    instructor = engine.get_lesson_instructor(student_name, tonight)
    
    if instructor:
        return f"{student_name}'s lesson tonight is with {instructor}"
    else:
        # Check next lesson
        lesson = engine.get_next_lesson_for_student(student_name)
        if lesson:
            return f"{student_name}'s next lesson is with {lesson.get('instructor_name', 'TBD')} on {lesson.get('date')} at {lesson.get('time')}"
        else:
            return f"No lessons found for {student_name}"
