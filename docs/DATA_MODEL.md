# Data Model

This is the practical MVP schema. It maps directly to the RTO control room workflow: import data, score orders, rescue NDRs, record actions, and prove savings.

## users

- id
- email
- name
- role
- created_at

## brands

- id
- name
- owner_user_id
- currency
- default_language
- forward_shipping_cost
- return_shipping_cost
- packaging_cost
- estimated_cac
- cod_fee
- gross_margin_percent
- risk_threshold_medium
- risk_threshold_high
- risk_threshold_critical
- courier_platforms
- created_at
- updated_at

## brand_members

- id
- brand_id
- user_id
- role
- created_at

## imports

- id
- brand_id
- filename
- source_type
- row_count
- success_count
- error_count
- uploaded_by
- created_at

## orders

- id
- brand_id
- import_id
- order_id
- awb
- order_date
- customer_name
- phone
- email
- full_address
- landmark
- pincode
- city
- state
- sku
- product_name
- quantity
- order_value
- payment_mode
- courier
- source_platform
- campaign_name
- shipment_status
- ndr_reason
- attempt_count
- final_status
- confirmation_status
- risk_score
- risk_bucket
- recommended_action
- created_at
- updated_at
- raw_data

Index recommendations:

- brand_id, order_id
- brand_id, awb
- brand_id, pincode
- brand_id, payment_mode
- brand_id, risk_bucket
- brand_id, final_status

## customers

- id
- brand_id
- phone_hash
- phone_last4
- name
- email
- total_orders
- total_rto
- total_delivered
- risk_label
- created_at
- updated_at

Privacy note: phone_hash supports repeat-customer logic without using raw phone everywhere.

## risk_scores

- id
- order_id
- score
- bucket
- reasons_json
- recommended_action
- created_at

## address_checks

- id
- order_id
- score
- issues_json
- suggested_question
- created_at

## ndr_cases

- id
- brand_id
- order_id
- awb
- courier
- ndr_reason_raw
- ndr_reason_normalized
- confidence
- attempt_count
- ndr_created_at
- customer_response_status
- recommended_action
- action_status
- final_outcome
- created_at
- updated_at

## messages

- id
- brand_id
- order_id
- ndr_case_id
- channel
- provider
- template_type
- recipient_phone_masked
- message_body
- status
- provider_message_id
- sent_at
- created_at

MVP provider values:

- mock
- manual_export

Future provider values:

- meta_cloud
- gupshup
- wati
- interakt
- aisensy

## customer_responses

- id
- brand_id
- order_id
- ndr_case_id
- channel
- raw_response
- intent
- confidence
- extracted_data_json
- created_at

## actions

- id
- brand_id
- order_id
- ndr_case_id
- action_type
- status
- assigned_to
- notes
- created_by
- created_at
- completed_at

Action types:

- ship_normally
- send_cod_confirmation
- request_address_update
- hold_order
- call_customer
- convert_to_prepaid
- request_reattempt
- update_address_with_courier
- mark_cancelled
- mark_rto
- escalate_to_ops
- block_or_flag_pincode

## savings_events

- id
- brand_id
- order_id
- source_feature
- event_type
- estimated_saving
- formula_note
- confidence
- calculation_json
- created_at

Event types:

- cancelled_before_shipping
- address_corrected_delivered
- ndr_rescued_delivered
- cod_converted_prepaid
- rto_loss_recorded
- address_corrected

## audit_logs

- id
- brand_id
- user_id
- action
- entity_type
- entity_id
- metadata_json
- created_at

Audit actions:

- csv_uploaded
- csv_imported
- export_created
- phone_unmasked
- data_deleted
- message_created
- customer_response_recorded
- action_completed

## Derived Reports

These do not need separate tables in the MVP unless caching is required:

- RTO rate by pincode.
- RTO rate by courier.
- RTO rate by SKU/product.
- RTO rate by payment mode.
- NDR reason distribution.
- Address quality issue distribution.
- Estimated savings by event type.
- Today’s Actions grouped queue.

## MVP Storage Choice

For the fastest local MVP, a lightweight local database can be used behind a repository layer. The production target remains Supabase Postgres so the schema should stay relational and portable.

## Version 0.2 Storage Choice

Version 0.2 uses a single browser `localStorage` workspace key for pilot durability. This keeps the CSV-first MVP simple while preserving the same logical entities:

- `brand`
- `orders`
- `imports`
- `ndrCases`
- `messages`
- `responses`
- `actions`
- `savingsEvents`
- `audits`

This is suitable for local demos and first pilot walkthroughs, but production should move the same model behind tenant-isolated server storage.

## Starter v1 Additions

Starter local storage uses `storage_version: starter_v1`.

Additional brand settings:

- category
- monthly_order_limit
- support_ops_cost
- software_cost_or_plan_fee

Starter plan state:

- current_plan
- over_limit

Event log shape:

- id
- type
- timestamp
- sourceFeature
- entityType
- entityId
- payload

Starter keeps all feature data local to the browser unless a future tenant-isolated storage backend is configured.

## Pro v1 Additions

Pro local storage uses `storage_version: pro_v1`.

Additional entities:

- `stores`: id, brand_id, store_name, platform, url, default_currency, active, created_at, updated_at.
- `custom_rules`: id, name, description, active, conditions, action, priority, created_at, updated_at.
- `policy_recommendations`: id, policy_type, title, affected_orders_count, estimated_leakage, expected_saving, risk, recommendation, status, created_at.
- `prepaid_opportunities`: score, recommended incentive, max safe incentive note, expected exposure, status.
- `ndr_playbooks`: reason, steps, default_template, escalation_rule, sla_hours, enabled.
- `weekly_reports` and `monthly_strategy_reports`: persisted founder report objects.
- `policy_simulations`: affected orders, baseline leakage, saved leakage, intervention cost, lost contribution, net benefit, risk notes.
- `report_exports`: report package/export metadata.

Order additions:

- store_id, source_store_name, utm_source, utm_medium, utm_campaign, ad_id, gross_margin, discount_amount, shipping_charge, cod_fee_actual, courier_charge_actual, customer_type, first_time_customer, return_reason, support_reason.

Action additions:

- policy_id optional, source_feature, priority, confidence, estimated_leakage, expected_saving_estimate, owner, notes.

Role behavior:

- admin can mutate, export, reveal phone, and delete data.
- ops can work action/NDR/messaging flows.
- analyst can use reports, exports, and simulations.
- viewer is read-only with masked phone.
