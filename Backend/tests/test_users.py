import pytest

def test_create_user_success(client):
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "Password123!",
        "full_name": "New User"
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert "password_hash" not in data

def test_create_user_duplicate_email(client):
    payload = {
        "username": "user1",
        "email": "dup@example.com",
        "password": "Password123!"
    }
    client.post("/users", json=payload)
    payload2 = {
        "username": "user2",
        "email": "dup@example.com",
        "password": "Password123!"
    }
    response = client.post("/users", json=payload2)
    assert response.status_code == 400

def test_create_user_invalid_payload(client):
    payload = {"username": "baduser"} # Missing email, password
    response = client.post("/users", json=payload)
    assert response.status_code == 422
    
def test_list_users(client):
    response = client.get("/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_me(client):
    response = client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
