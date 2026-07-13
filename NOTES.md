# Cherry — Frontend notes

Plain HTML/CSS/JS frontend for your Spring Boot backend. No build step —
just open `index.html` in a browser (or serve the folder with any static
server) after your backend is running.

## Setup

1. Open `js/api.js` and check the first line:
   ```js
   const API_BASE = 'http://localhost:8080';
   ```
   Change this if your backend runs on a different host/port.
2. Make sure CORS is enabled on the backend for whatever origin you're
   serving this frontend from (e.g. `@CrossOrigin` or a global CORS config),
   otherwise the browser will block the requests.
3. Open `index.html`.

## Auth

- Login (`POST /api/cherry/users/login`) is expected to return the JWT as a
  plain string. It's stored in `localStorage` and sent as
  `Authorization: Bearer <token>` on every request after that.
- A 401 response anywhere automatically clears the stored session and sends
  the user back to the login page.
- After login, the app calls `GET /api/cherry/profile/my` once to cache your
  id/username/display name/photo locally (used for things like "is this my
  post", prefilling `userId` on new posts, etc). It refreshes quietly in the
  background on every authenticated page.

## Every controller is wired up

| Controller | Where in the UI |
|---|---|
| `UserController` | Sign up / Sign in, Explore (search + list), Admin, Account settings (change username/password/delete account) |
| `ProfileController` | Profile page — view, edit bio/display name, upload/remove profile picture |
| `PostController` | Home feed (For you / Latest / Trending / All), composer with image upload, search, single post page, edit/delete own post |
| `CommentController` | Comments section on the post page — add / edit / delete / count |
| `LikeController` | Like button on every post card |
| `FollowController` | Follow/unfollow buttons, follower & following lists (`connections.html`) |
| `BookmarkController` | Save/unsave button on posts, dedicated Bookmarks page |
| `NotificationController` | Notifications page |
| `AdminController` | Admin page — list users with ban/unban, delete post/comment by ID |

## Things worth knowing (backend quirks found while reading the code)

These aren't frontend bugs — flagging them so nothing looks "broken" for the
wrong reason:

1. **`PostController.updatePost`** is declared with two `@RequestBody`
   parameters (`PostRequestDTO post` and `Long id`). Spring MVC only binds
   one `@RequestBody` per request, so this endpoint likely won't work as-is.
   The frontend sends the post id as both a query param (`?id=`) and a field
   in the JSON body so it's easy to wire up once you adjust the endpoint to
   accept the id via `@PathVariable` or read it off the DTO.
2. **`LikeController`** paths use `{id}` (e.g. `/add/{id}`) but the method
   parameter is named `postId` without an explicit `@PathVariable("id")`.
   Depending on your Spring/compiler settings this may fail to bind. If likes
   don't register, this is the first place to check.
3. **`AdminController`** has no visible role/permission check — any signed-in
   user can currently hit `/api/admin/**` and reach the Admin page in this
   UI. Worth adding a role check (and a `role`/`isAdmin` field on `User`)
   before this goes anywhere near production.
4. No backend endpoint returns follower/following **counts for an arbitrary
   user**, only for "myself" (`/follow/followers/count`, `/follow/following/count`).
   The frontend works around this by fetching the follower/following lists
   for a profile and using their length instead.

## Response DTO field names — please double check

I had your **request** DTOs (`UserRequestDTO`, `LoginRequestDTO`,
`PostRequestDTO`, `CommentRequestDTO`, `UserProfileRequestDTO`) but not your
**response** DTOs (`UserResponseDTO`, `PostResponseDTO`, `CommentResponseDTO`,
`UserProfileResponseDTO`, `Notification`). Since I couldn't see their exact
field names, the JS reads several common variants defensively — e.g. for a
profile picture it checks `imageUrl`, `profileImage`, `picture`, `image`,
`profilePicture`, `avatarUrl` in that order and uses whichever one exists.

The single helper this all goes through is `pick()` in `js/ui.js`. If
something isn't showing up correctly (a name, a picture, a date), it's almost
always because the real field name isn't in that list yet — send me the
actual DTO and I'll add the exact key so it just works, no guessing.

## No browser popups

Per your request, there's no `alert()`, `confirm()`, or `prompt()` anywhere.
Confirmations (delete post, ban user, log out, etc.) use an in-page modal
(`confirmModal()` in `js/ui.js`), and all feedback uses toast notifications
in the top-right corner instead of native dialogs.

## Design

Blue-and-white throughout — navy/blue brand color (`#2451F0`), white surfaces,
soft blue tints for hover/active states. Left sidebar navigation on desktop
that collapses into a slide-out drawer on mobile. Space Grotesk for headings,
Inter for body text (loaded from Google Fonts — needs internet access when
the page is opened; swap for local font files if you need this to work fully
offline).
