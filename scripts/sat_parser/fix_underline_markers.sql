-- Restores the two underline markers from the original August 2024 US-D PDF.
-- The UI renders <u>...</u> in a passage as a real underline.
UPDATE public.sat_ebrw_mcq
SET passage = replace(
  passage,
  'Douglas Turner Ward, who worked as an actor, director, and playwright, had met',
  'Douglas Turner Ward, <u>who worked as an actor, director, and playwright,</u> had met'
)
WHERE source = '2024 Aug US-D @EliteXSAT'
  AND page = 6
  AND question ILIKE '%underlined portion%';

UPDATE public.sat_ebrw_mcq
SET passage = replace(
  passage,
  'winged dinosaurs, such as the bat-like Yi qi. However,',
  'winged dinosaurs, <u>such as the bat-like Yi qi.</u> However,'
)
WHERE source = '2024 Aug US-D @EliteXSAT'
  AND page = 7
  AND question ILIKE '%underlined portion%';

SELECT id, source, page, passage
FROM public.sat_ebrw_mcq
WHERE source = '2024 Aug US-D @EliteXSAT' AND page IN (6, 7)
ORDER BY page;
