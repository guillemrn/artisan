# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Artisan is for owners and operators of small food businesses, especially artisan producers and bakeries that sell both to points of sale and directly to the public. The product should also be able to expand later toward service-based entrepreneurs, such as people who sell appointments or services like nails, beauty, wellness, or similar local businesses.

## Product Purpose

Artisan is a lightweight operating system for small businesses to register sales, manage orders, track customers, control inventory, record pending payments, and understand costs, revenue, and profit. Success means the operator can run the daily business with less notebook work, fewer missed collections, and clearer visibility into what was sold, delivered, changed, stocked, and earned.

## Positioning

Artisan should combine the speed of a daily POS, the financial clarity of inventory and margin tracking, and the practical workflows of routes, points of sale, consignation, pending payments, and customer orders. Its advantage is not being a generic register; it should fit the way small local businesses actually sell, deliver, collect, and restock.

## Operating Context

The current product supports a food-business workflow with products, stock, production cost, distributor price, public price, customers, sales, tickets, payment methods, pending payments, consignation, courtesy sales, product changes/returns, CSV import/export, and business profile settings.

Operators may use the app while preparing orders, delivering to points of sale, selling directly, reconciling pending payments, adding inventory, or reviewing product performance. The interface should stay quick enough for repeated daily use and clear enough for non-technical users.

## Capabilities and Constraints

Current capabilities include authentication with Supabase or local demo mode, sales registration, ticket generation, product and client management, inventory updates, sales history, search, dashboard metrics, recipe cost calculation, CSV import/export, feedback reporting, and profile settings.

Known product constraints:

- The app must preserve support for both point-of-sale customers and public/direct customers.
- Product data must preserve cost, distributor price, public price, and stock.
- Sales must preserve payment state, delivery state, item quantities, changes/returns, cost, total, and profit.
- Pending payments, consignation, courtesy sales, and customer orders are first-class business realities, not edge cases.
- Future support for service businesses is a product direction, but the current codebase is still product/inventory-led.

## Brand Commitments

The product name is Artisan. The current interface language is Spanish and should remain approachable, practical, and business-owner friendly. Seed content must stay fictional and generic; future work must not treat demo data as universal customer proof.

## Evidence on Hand

Repository evidence:

- `src/lib/artisan-data.ts` defines products, clients, payment methods, sale items, sales, production suggestions, and MXN formatting.
- `src/routes/nueva-venta.tsx` contains the three-step sale workflow.
- `src/routes/index.tsx` contains dashboard, filters, KPIs, CSV import/export, pending sales, and inventory actions.
- `src/routes/productos.tsx` and `src/routes/productos_.$productId.tsx` contain product management and product detail workflows.
- `src/routes/clientes.tsx` and `src/routes/clientes_.$clientId.tsx` contain customer management.
- `src/routes/ticket/$saleId.tsx` contains ticket output.
- `src/core/auth/auth-context.tsx` contains Supabase/demo authentication behavior.

No real testimonials, production customer names, pricing claims, external benchmarks, or case studies are present in the repository. Future work should not invent them.

## Product Principles

1. Optimize for the operator in motion: daily actions should be fast, obvious, and forgiving.
2. Treat money and inventory as trust-critical: totals, costs, stock, pending payments, and orders must be hard to misread or lose.
3. Fit small-business reality: support direct sales, points of sale, routes, consignation, changes, courtesy items, and later service appointments without forcing enterprise complexity.
4. Keep business language plain: use Spanish copy that feels useful to non-technical entrepreneurs.
5. Preserve clarity before visual flourish: the interface can feel polished, but operational confidence comes first.

## Accessibility & Inclusion

The product should be usable by non-technical small-business operators on web devices, including mobile-sized screens used during daily work. Future UI decisions should prioritize readable Spanish labels, clear feedback after saves, accessible controls, keyboard/focus support where relevant, and touch targets suitable for field use.
