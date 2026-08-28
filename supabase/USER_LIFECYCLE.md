# User lifecycle notifications

Artisan records these milestones once per user:

- `user_confirmed`: the account owner confirmed their email.
- `first_product_created`: the user created their first product.
- `first_sale_created`: the user registered their first sale (the current aha moment).

Only `user_confirmed` and `first_sale_created` send an email. Product creation is retained for funnel analysis.

## Required secrets

Create a dedicated Resend API key and add these Edge Function secrets in Supabase:

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Artisan <notificaciones@guillermoml.com>
ADMIN_NOTIFICATION_EMAIL=hola@guillermoml.com
LIFECYCLE_WEBHOOK_SECRET=<a long random value>
```

Never add the real values to this repository or to a `VITE_` environment variable.

## Deploy

1. Apply `supabase/migrations/202608260001_track_user_milestones.sql` to the production database.
2. Deploy the function:

```bash
npx supabase functions deploy notify-user-milestone --no-verify-jwt
```

3. In Supabase, open **Database > Webhooks** and create a webhook:

- Name: `notify-user-milestone`
- Table: `public.user_milestones`
- Event: `INSERT`
- Method: `POST`
- URL: `https://<project-ref>.supabase.co/functions/v1/notify-user-milestone`
- Header: `x-artisan-webhook-secret: <the same LIFECYCLE_WEBHOOK_SECRET>`

The function does not trust the public URL. It rejects calls without the shared webhook secret and uses the server-only service role to mark notifications as sent.

## Verify

After testing with a new confirmed account, a product, and a sale, inspect the funnel:

```sql
select
  event_name,
  count(*) as users,
  min(occurred_at) as first_seen,
  max(occurred_at) as last_seen
from public.user_milestones
group by event_name
order by event_name;
```

Inspect email delivery state:

```sql
select
  event_name,
  notification_status,
  count(*)
from public.user_milestones
group by event_name, notification_status
order by event_name, notification_status;
```

Expected behavior:

- Confirmed user: `sent`
- First product: `skipped`
- First sale: `sent`
- Repeated products or sales: no additional milestone row or email

Inspect activation and time to value:

```sql
select
  count(*) as confirmed_users,
  count(first_product_at) as users_with_product,
  count(first_sale_at) as users_at_aha_moment,
  round(avg(hours_to_first_product), 1) as avg_hours_to_product,
  round(avg(hours_to_first_sale), 1) as avg_hours_to_aha,
  count(*) filter (where aha_within_7_days) as aha_within_7_days
from public.user_activation_funnel;
```
