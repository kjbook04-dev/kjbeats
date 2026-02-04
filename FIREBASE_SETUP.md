# Firebase Setup (Free Tier)

This project now uses Firebase for:
- Login/authentication (Firebase Auth)
- User profile + friends + player settings (Cloud Firestore)
- Songs/profile images (Firebase Storage)
- Playlists and DM share messages (Cloud Firestore)

## 1) Create Firebase Project

1. Go to Firebase Console.
2. Create a project (Spark/free plan is fine).
3. Add a **Web App** to the project.
4. Copy the web config values.

## 2) Enable Authentication

1. Firebase Console -> Authentication -> Sign-in method
2. Enable **Email/Password**.

## 3) Enable Firestore

1. Firebase Console -> Firestore Database
2. Create database (Production mode or Test mode).

## 4) Add Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Then restart the dev server.

## 5) Firestore Security Rules

Paste these rules in Firestore -> Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Username lookup for login flow (username -> email/uid)
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update, delete: if request.auth != null && request.auth.uid == uid
        || (
          // Allow friend notification, request, or friends appends by other authed users
          request.auth != null
          && request.resource.data.diff(resource.data).changedKeys().hasOnly(['friendNotifications', 'friendRequests', 'friends'])
          && (
            (
              request.resource.data.friendNotifications is list
              && (!resource.data.keys().hasAny(['friendNotifications']) || resource.data.friendNotifications is list)
              && (!resource.data.keys().hasAny(['friendNotifications']) || request.resource.data.friendNotifications.hasAll(resource.data.friendNotifications))
              && request.resource.data.friendNotifications.size() > (resource.data.keys().hasAny(['friendNotifications']) ? resource.data.friendNotifications.size() : 0)
            )
            ||
            (
              request.resource.data.friendRequests is list
              && (!resource.data.keys().hasAny(['friendRequests']) || resource.data.friendRequests is list)
              && (!resource.data.keys().hasAny(['friendRequests']) || request.resource.data.friendRequests.hasAll(resource.data.friendRequests))
              && request.resource.data.friendRequests.size() > (resource.data.keys().hasAny(['friendRequests']) ? resource.data.friendRequests.size() : 0)
            )
            ||
            (
              request.resource.data.friends is list
              && (!resource.data.keys().hasAny(['friends']) || resource.data.friends is list)
              && (!resource.data.keys().hasAny(['friends']) || request.resource.data.friends.hasAll(resource.data.friends))
              && request.resource.data.friends.size() > (resource.data.keys().hasAny(['friends']) ? resource.data.friends.size() : 0)
            )
          )
        );

      match /songs/{songId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }

      match /playlists/{playlistId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read, create: if request.auth != null;
        allow update, delete: if false;
      }
    }
  }
}
```

## 6) Storage Rules

In Firebase Storage -> Rules:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Notes

- Existing localStorage accounts are not auto-migrated to Firebase.
- New signups are stored in Firebase.
- Login still works by **username + password** in the UI.
