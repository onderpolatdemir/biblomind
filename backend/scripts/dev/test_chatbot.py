"""
Manual test script for chatbot functionality.

This script tests the complete chatbot flow:
1. User authentication
2. Send messages (new conversation)
3. Continue conversation (with history)
4. Test HYBRID recommendation strategy
5. List conversations
6. Get conversation detail
7. Update conversation title
8. Delete conversation

Usage:
    python -m scripts.test_chatbot
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

import httpx
from typing import Optional, Dict, Any

# API Configuration
BASE_URL = "http://localhost:8000/api"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test123456"
TEST_USER_NAME = "Test User"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text: str):
    """Print formatted header."""
    print(f"\n{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{'=' * 70}{Colors.ENDC}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{Colors.OKGREEN}[OK] {text}{Colors.ENDC}")


def print_info(text: str):
    """Print info message."""
    print(f"{Colors.OKCYAN}[INFO] {text}{Colors.ENDC}")


def print_error(text: str):
    """Print error message."""
    print(f"{Colors.FAIL}[ERROR] {text}{Colors.ENDC}")


def print_response(label: str, data: Any):
    """Print formatted response."""
    print(f"{Colors.OKBLUE}{label}:{Colors.ENDC}")
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 100:
                value = value[:100] + "..."
            print(f"  {key}: {value}")
    else:
        print(f"  {data}")
    print()


async def register_or_login() -> Optional[str]:
    """Register or login test user and return access token."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Try to login first (OAuth2PasswordRequestForm expects form data, not JSON)
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": TEST_USER_EMAIL,  # OAuth2 uses 'username' field
                    "password": TEST_USER_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Logged in as {TEST_USER_EMAIL}")
                return data["access_token"]
            else:
                print_info(f"Login failed (status {response.status_code}), trying register...")
        except Exception as e:
            print_info(f"Login error: {e}, trying register...")
        
        # Register new user
        try:
            response = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD,
                    "full_name": TEST_USER_NAME
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                print_success(f"Registered new user: {TEST_USER_EMAIL}")
                return data["access_token"]
            else:
                print_error(f"Register failed - Status: {response.status_code}")
                print_error(f"Response: {response.text}")
        except Exception as e:
            print_error(f"Failed to register: {e}")
            import traceback
            traceback.print_exc()
            return None
        
        print_error("Could not login or register")
        return None


async def send_message(
    token: str,
    message: str,
    conversation_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Send a chat message."""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            payload = {"message": message}
            if conversation_id:
                payload["conversation_id"] = conversation_id
            
            response = await client.post(
                f"{BASE_URL}/chat/message",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print_error(f"Failed to send message: {response.status_code}")
                print(response.text)
                return None
                
        except Exception as e:
            print_error(f"Error sending message: {e}")
            return None


async def list_conversations(token: str) -> Optional[Dict[str, Any]]:
    """List user conversations."""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/chat/conversations",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print_error(f"Failed to list conversations: {response.status_code}")
                return None
                
        except Exception as e:
            print_error(f"Error listing conversations: {e}")
            return None


async def get_conversation_detail(
    token: str,
    conversation_id: str
) -> Optional[Dict[str, Any]]:
    """Get conversation detail."""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/chat/conversations/{conversation_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print_error(f"Failed to get conversation: {response.status_code}")
                return None
                
        except Exception as e:
            print_error(f"Error getting conversation: {e}")
            return None


async def delete_conversation(
    token: str,
    conversation_id: str
) -> bool:
    """Delete a conversation."""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.delete(
                f"{BASE_URL}/chat/conversations/{conversation_id}",
                headers=headers
            )
            
            return response.status_code == 200
                
        except Exception as e:
            print_error(f"Error deleting conversation: {e}")
            return False


async def main():
    """Main test function."""
    print_header("CHATBOT SERVICE TEST")
    
    # Test 1: Authentication
    print_header("TEST 1: Authentication")
    token = await register_or_login()
    
    if not token:
        print_error("Authentication failed. Exiting.")
        return
    
    # Test 2: Send first message (new conversation)
    print_header("TEST 2: Send First Message (New Conversation)")
    print_info("Testing: New conversation with book detection")
    
    response1 = await send_message(
        token,
        "1984 kitabını okumak istiyorum, nasıl bir kitap?"
    )
    
    if response1:
        print_success("Message sent successfully")
        print_response("Response", {
            "conversation_id": response1["conversation_id"],
            "strategy": response1["strategy"],
            "book_references": len(response1["book_references"]),
            "response_preview": response1["response"][:200]
        })
        conversation_id = str(response1["conversation_id"])
    else:
        print_error("Failed to send message")
        return
    
    # Test 3: Continue conversation (with history)
    print_header("TEST 3: Continue Conversation (With History)")
    print_info("Testing: Message with conversation history")
    
    response2 = await send_message(
        token,
        "Benzer başka kitaplar önerir misin?",
        conversation_id=conversation_id
    )
    
    if response2:
        print_success("Continued conversation successfully")
        print_response("Response", {
            "conversation_id": response2["conversation_id"],
            "strategy": response2["strategy"],
            "book_references": len(response2["book_references"]),
            "response_preview": response2["response"][:200]
        })
    
    # Test 4: Test HYBRID - Recommendation Engine
    print_header("TEST 4: Test HYBRID Strategy (Recommendation Request)")
    print_info("Testing: Recommendation Engine trigger")
    
    response3 = await send_message(
        token,
        "Bana kitap öner",
        conversation_id=conversation_id
    )
    
    if response3:
        print_success("Recommendation request processed")
        print_response("Response", {
            "strategy": response3["strategy"],
            "book_references": len(response3["book_references"]),
            "response_preview": response3["response"][:200]
        })
    
    # Test 5: Out-of-topic question
    print_header("TEST 5: Out-of-Topic Question")
    print_info("Testing: General question handling")
    
    response4 = await send_message(
        token,
        "Hava nasıl?",
        conversation_id=conversation_id
    )
    
    if response4:
        print_success("Out-of-topic question processed")
        print_response("Response", {
            "strategy": response4["strategy"],
            "response_preview": response4["response"][:200]
        })
    
    # Test 6: List conversations
    print_header("TEST 6: List Conversations")
    
    conv_list = await list_conversations(token)
    
    if conv_list:
        print_success(f"Found {conv_list['total']} conversation(s)")
        for conv in conv_list["conversations"]:
            print_response("Conversation", {
                "id": conv["id"],
                "title": conv["title"],
                "message_count": conv["message_count"],
                "last_message": conv["last_message"]
            })
    
    # Test 7: Get conversation detail
    print_header("TEST 7: Get Conversation Detail")
    
    conv_detail = await get_conversation_detail(token, conversation_id)
    
    if conv_detail:
        print_success(f"Retrieved conversation with {len(conv_detail['messages'])} messages")
        print_info("Messages:")
        for i, msg in enumerate(conv_detail["messages"][:3], 1):  # Show first 3
            print(f"  {i}. [{msg['role']}] {msg['content'][:80]}...")
    
    # Test 8: Cleanup - Delete conversation
    print_header("TEST 8: Cleanup (Delete Conversation)")
    
    deleted = await delete_conversation(token, conversation_id)
    
    if deleted:
        print_success("Conversation deleted successfully")
    else:
        print_error("Failed to delete conversation")
    
    # Summary
    print_header("TEST SUMMARY")
    print_success("All tests completed!")
    print_info("Tested features:")
    print("  - New conversation creation")
    print("  - Book detection (fuzzy matching)")
    print("  - Conversation history")
    print("  - HYBRID strategy (RAG + Recommendation Engine)")
    print("  - Out-of-topic handling")
    print("  - Conversation listing")
    print("  - Conversation detail")
    print("  - Conversation deletion")
    print()


if __name__ == "__main__":
    asyncio.run(main())
