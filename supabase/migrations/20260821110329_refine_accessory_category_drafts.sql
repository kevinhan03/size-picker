-- Refine the initial Acc split for English product names. Keep the leaf NULL:
-- these are parent-category drafts only and still require administrator review.
update public.products
set category = 'Bag', sub_category = null
where category = 'FashionAccessory'
  and name ~* '(\\bbag\\b|\\btote\\b|\\bpouch\\b|\\bboston\\b|shopper|traveller)';

update public.products
set category = 'JewelryWatch', sub_category = null
where category = 'FashionAccessory'
  and name ~* '(\\bring\\b|\\bbangle\\b|\\bwatch\\b|seiko|hamilton|bracelet|necklace|earring)';
