-- PostgreSQL POSIX regex does not treat JavaScript-style \b as a word boundary.
-- Use the product terms directly for the conservative parent-category draft.
update public.products
set category = 'Bag', sub_category = null
where category = 'FashionAccessory'
  and name ~* '(bag|tote|pouch|boston|shopper|traveller)';

update public.products
set category = 'JewelryWatch', sub_category = null
where category = 'FashionAccessory'
  and name ~* '(ring|bangle|watch|seiko|hamilton|bracelet|necklace|earring)';
