# Note App Backend

Express and MongoDB API for the Note App.

**Live API:** https://note-api.iarafathossain.me

## Deployment

Deployed at AWS EC2 with MongoDB Atlas, Nginx reverse proxy, and PM2 process manager.

## Tech stack

- Node.js, Express 5, and TypeScript
- MongoDB with Mongoose
- JWT authentication with HTTP-only cookies
- Zod request validation

## Local development

```bash
git clone https://github.com/iarafathossain/note-app-backend.git
cd note-app-backend
yarn install
```

Create `.env`:

```env
DATABASE_URL=mongodb://localhost:27017/note-app
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret
REFRESH_TOKEN_EXPIRES_IN=7d
ACCESS_TOKEN_COOKIE_MAX_AGE=15m
REFRESH_TOKEN_COOKIE_MAX_AGE=7d
```

Start the API:

```bash
yarn dev
```

The API runs at `http://localhost:8000`. Health check: `GET /api/health`.

## Scripts

```bash
yarn dev       # Start with watch mode
yarn build     # Compile TypeScript
yarn start     # Run the compiled server
yarn typecheck # Check types without emitting files
```

## API modules

All routes are prefixed with `/api/v1`:

- `/auth` — register, login, refresh, logout, and current user
- `/users` — admin user management and interest grouping
- `/posts` — public post browsing and authenticated management
- `/notes` — authenticated note management

Requests are validated with Zod, and protected routes use authentication and role-based authorization middleware.

## Authentication cookies

Access and refresh tokens are stored in HTTP-only cookies. Production uses secure, cross-site cookies; local development uses `lax` cookies:

```ts
const authCookieOptions = {
  httpOnly: true,
  secure: envVariables.NODE_ENV === "production",
  sameSite:
    envVariables.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  path: "/",
};
```

`httpOnly` prevents JavaScript access, `secure` requires HTTPS in production, and `sameSite` supports the deployed frontend/backend while remaining convenient locally.

## MongoDB aggregations

### Group users by interest

This pipeline expands each user's interests, removes invalid values, deduplicates users per interest, and returns users grouped alphabetically:

```ts
UserModel.aggregate<GroupedInterest>([
  {
    $unwind: {
      path: "$interests",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $match: {
      interests: { $type: "string", $ne: "" },
    },
  },
  {
    $sort: {
      interests: 1,
      _id: 1,
    },
  },
  {
    $group: {
      _id: {
        interest: "$interests",
        userId: "$_id",
      },
      user: {
        $first: {
          _id: "$_id",
          name: "$name",
          email: "$email",
        },
      },
    },
  },
  {
    $group: {
      _id: "$_id.interest",
      users: {
        $push: "$user",
      },
    },
  },
  {
    $project: {
      _id: 0,
      interest: "$_id",
      users: 1,
    },
  },
  {
    $sort: {
      interest: 1,
    },
  },
]);
```

### Return a user's posts

This pipeline joins a user with their posts, sorts by newest first, and returns paginated posts plus a total count:

```ts
const { skip } = getPagination(page, limit);

const [result] = await UserModel.aggregate<GroupedPostsAggregation>([
  {
    $match: {
      _id: new Types.ObjectId(userId),
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
    },
  },
  {
    $lookup: {
      from: PostModel.collection.name,
      let: { ownerId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$userId", "$$ownerId"],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            posts: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: "total" }],
          },
        },
      ],
      as: "postData",
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      postData: { $arrayElemAt: ["$postData", 0] },
    },
  },
]);
```
