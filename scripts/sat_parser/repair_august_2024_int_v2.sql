-- Repairs verified against output/sat_parser/2024-aug-int-v2-ready/ebrw_mcq.csv.
-- This is deliberately limited to four known-bad live rows. Run once in the
-- Supabase SQL editor; every UPDATE targets its immutable uid.
BEGIN;

-- The old import accidentally attached a different, truncated question here.
UPDATE public.sat_ebrw_mcq
SET
  passage = $$The following text is from Jerome K. Jerome's 1889 novel Three Men in a Boat (To Say Nothing of the Dog). The narrator and two friends are taking a boat down the River Thames in England. In a boat, I have always noticed that it is the fixed idea of each member of the crew that he is doing everything. Harris's notion was, that it was he alone who had been working, and that both George and I had been imposing upon him. George, on the other hand, ridiculed the idea of Harris's having done anything more than eat and sleep, and had a cast-iron opinion that it was he—George himself—who had done all the labour worth speaking of.$$,
  question = 'Which choice best states the main idea of the text?',
  option_a = 'The narrator recognizes that Harris''s and George''s attitudes are typical of how crew members view their own contributions on boats.',
  option_b = 'The narrator has recognized that Harris spends most of his time eating and sleeping.',
  option_c = 'Everyone in the group has been given tasks to do, but the narrator hasn''t been willing to complete his.',
  option_d = 'The amount of work that needs to be done on the boat is likely more than the narrator, George, and Harris can handle.',
  correct_answer = 'A',
  has_image = false,
  image_url = NULL
WHERE uid = '522c5998-e16f-4bb3-bec3-4482f7503b1f';

-- Reviewed local SVG assets are committed in public/sat_images/ebrw.
UPDATE public.sat_ebrw_mcq
SET has_image = true, image_url = '/sat_images/ebrw/august-2024-int-v2-p11-q11.svg'
WHERE uid = '60a0bf2a-93d9-446e-abfe-d1664042f027';

UPDATE public.sat_ebrw_mcq
SET has_image = true, image_url = '/sat_images/ebrw/august-2024-int-v2-p12-q12.svg'
WHERE uid = '0e54e132-cb9a-418d-ade9-01cef12d6940';

UPDATE public.sat_ebrw_mcq
SET has_image = true, image_url = '/sat_images/ebrw/august-2024-int-v2-p14-q14.svg'
WHERE uid = '2f6649f4-c04a-4300-90c1-709d6ffec9e4';

COMMIT;
