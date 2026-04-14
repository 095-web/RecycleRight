/* ============================================================
   RecycleRight — Static Data
   Recycling items, quiz questions, achievements, avatars
   ============================================================ */

/* ---------- Recycling Item Status Keys ----------
   yes      = Recyclable in most curbside programs
   check    = Accepted in some areas — check locally
   no       = Not accepted in most curbside programs
   special  = Requires a special drop-off or program
   ------------------------------------------------ */

const CATEGORIES = [
  { id: 'paper',      label: 'Paper & Cardboard', icon: 'fa-newspaper' },
  { id: 'plastics',   label: 'Plastics',           icon: 'fa-bottle-water' },
  { id: 'glass',      label: 'Glass',              icon: 'fa-wine-bottle' },
  { id: 'metals',     label: 'Metals',             icon: 'fa-circle-dot' },
  { id: 'electronics',label: 'Electronics',        icon: 'fa-laptop' },
  { id: 'food',       label: 'Food & Organic',     icon: 'fa-apple-whole' },
  { id: 'hazardous',  label: 'Hazardous',          icon: 'fa-triangle-exclamation' },
  { id: 'batteries',  label: 'Batteries',          icon: 'fa-battery-half' },
  { id: 'textiles',   label: 'Textiles',           icon: 'fa-shirt' },
  { id: 'household',  label: 'Household',          icon: 'fa-house' },
];

const RECYCLING_ITEMS = [
  /* ---- Paper & Cardboard ---- */
  { id:1,  name:'Cardboard Box',          category:'paper',    status:'yes',    tip:'Flatten boxes and remove all tape and styrofoam inserts before recycling.' },
  { id:2,  name:'Newspaper',              category:'paper',    status:'yes',    tip:'Stack or bundle loosely. Avoid soaking in water.' },
  { id:3,  name:'Office / Printer Paper', category:'paper',    status:'yes',    tip:'Shredded paper is usually OK — check with your local program.' },
  { id:4,  name:'Paper Bag',              category:'paper',    status:'yes',    tip:'Empty and fold. Brown kraft paper bags are widely accepted.' },
  { id:5,  name:'Pizza Box',              category:'paper',    status:'check',  tip:'Heavily greasy boxes contaminate recycling. Tear off and keep only the clean lid.' },
  { id:6,  name:'Paper Coffee Cup',       category:'paper',    status:'no',     tip:'The plastic/wax lining prevents recycling. Use a reusable cup instead.' },
  { id:7,  name:'Glossy Magazine',        category:'paper',    status:'yes',    tip:'Most curbside programs accept glossy paper. Remove any plastic polywrap.' },
  { id:8,  name:'Paper Egg Carton',       category:'paper',    status:'yes',    tip:'Cardboard egg cartons are widely recyclable; foam cartons are not.' },
  { id:9,  name:'Wax Paper / Parchment',  category:'paper',    status:'no',     tip:'The wax coating cannot be separated from the fiber. Compost if unbleached.' },
  { id:10, name:'Paper Towel / Tissue',   category:'paper',    status:'no',     tip:'Too short-fibered to recycle effectively. Compost clean paper towels.' },
  { id:11, name:'Cardboard Milk Carton',  category:'paper',    status:'check',  tip:'Coated cartons require special processing. Check if your municipality accepts them.' },
  { id:12, name:'Cardboard Tube (TP/PT)', category:'paper',    status:'yes',    tip:'Toilet paper and paper towel rolls are easily recyclable.' },

  /* ---- Plastics ---- */
  { id:13, name:'#1 PET Plastic Bottle',   category:'plastics', status:'yes',   tip:'One of the most widely recycled plastics. Rinse, replace cap, and recycle.' },
  { id:14, name:'#2 HDPE Milk Jug',        category:'plastics', status:'yes',   tip:'Rinse thoroughly. Labels do not need to be removed.' },
  { id:15, name:'#2 HDPE Shampoo Bottle',  category:'plastics', status:'yes',   tip:'Empty completely. HDPE is highly valuable for recycling.' },
  { id:16, name:'#3 PVC (Pipes/Blister)',  category:'plastics', status:'no',    tip:'PVC releases toxic chlorine during recycling. Very few programs accept it.' },
  { id:17, name:'#4 LDPE Plastic Bag',     category:'plastics', status:'special',tip:'Never put in curbside bins — bags jam sorting machinery. Drop off at grocery store collection points.' },
  { id:18, name:'#5 PP Yogurt Container',  category:'plastics', status:'check', tip:'PP acceptance is growing. Check your local program.' },
  { id:19, name:'#6 PS Foam Cup/Plate',    category:'plastics', status:'no',    tip:'Polystyrene foam (Styrofoam) is rarely accepted. Look for specialty foam recyclers.' },
  { id:20, name:'#6 PS Plastic Cutlery',   category:'plastics', status:'no',    tip:'Too small for sorting machinery. Switch to reusable or compostable alternatives.' },
  { id:21, name:'#7 Other Plastics',       category:'plastics', status:'no',    tip:'This catch-all category is rarely recyclable curbside. Check the label.' },
  { id:22, name:'Plastic Straw',           category:'plastics', status:'no',    tip:'Too small and lightweight for sorters. Switch to paper, metal, or silicone straws.' },
  { id:23, name:'Plastic Bottle Cap',      category:'plastics', status:'check', tip:'Many programs now accept caps on the bottle. Check locally — some collect them separately.' },
  { id:24, name:'Plastic Clamshell (PET)', category:'plastics', status:'check', tip:'Hard PET clamshells are sometimes accepted. Rinse food residue completely.' },
  { id:25, name:'Plastic Wrap / Cling Film',category:'plastics',status:'special',tip:'Thin film plastic goes to store drop-off, not curbside bins.' },
  { id:26, name:'Bubble Wrap',             category:'plastics', status:'special',tip:'Drop off with other plastic bags at grocery/retail store film recycling bins.' },

  /* ---- Glass ---- */
  { id:27, name:'Glass Bottle (clear)',    category:'glass',    status:'yes',   tip:'Rinse and recycle. Lids and caps should be removed and recycled separately.' },
  { id:28, name:'Glass Bottle (colored)',  category:'glass',    status:'yes',   tip:'Brown and green glass is recyclable. Do not mix with clear glass if separated.' },
  { id:29, name:'Glass Food Jar',          category:'glass',    status:'yes',   tip:'Rinse the jar. Metal lids can be placed loose in the bin separately.' },
  { id:30, name:'Broken Glass',           category:'glass',    status:'check', tip:'Wrap in newspaper, label "Broken Glass", and check if your program accepts it.' },
  { id:31, name:'Window / Plate Glass',   category:'glass',    status:'no',    tip:'Different chemical composition from bottles. Contact a glass specialist for disposal.' },
  { id:32, name:'Mirror',                 category:'glass',    status:'no',    tip:'Mirrors have a metal coating that makes them incompatible with glass recycling.' },

  /* ---- Metals ---- */
  { id:33, name:'Aluminum Can',           category:'metals',   status:'yes',   tip:'Aluminum is infinitely recyclable. Rinse and crush to save space.' },
  { id:34, name:'Steel / Tin Can',        category:'metals',   status:'yes',   tip:'Rinse food residue. Labels do not need to be removed.' },
  { id:35, name:'Aluminum Foil (clean)',  category:'metals',   status:'yes',   tip:'Ball up into a fist-sized clump before placing in the bin.' },
  { id:36, name:'Aluminum Foil (greasy)', category:'metals',   status:'no',    tip:'Grease contamination prevents recycling. Clean thoroughly or dispose as trash.' },
  { id:37, name:'Empty Aerosol Can',      category:'metals',   status:'yes',   tip:'Must be completely empty. Never puncture or compress an aerosol can.' },
  { id:38, name:'Metal Lid / Jar Cap',    category:'metals',   status:'yes',   tip:'Place small lids inside a steel can and crimp the top closed before recycling.' },
  { id:39, name:'Wire Coat Hanger',       category:'metals',   status:'special',tip:'Hangers tangle on conveyor belts. Return to dry cleaners or donate to thrift stores.' },
  { id:40, name:'Scrap Metal',            category:'metals',   status:'special',tip:'Take large scrap metal to a metal recycling yard or scrap dealer.' },

  /* ---- Electronics ---- */
  { id:41, name:'Smartphone / Tablet',    category:'electronics', status:'special', tip:'Contains valuable metals. Return to manufacturer, donate, or bring to an e-waste event.' },
  { id:42, name:'Laptop / Computer',      category:'electronics', status:'special', tip:'Many retailers (Best Buy, Staples) accept old electronics for certified recycling.' },
  { id:43, name:'TV / Monitor',           category:'electronics', status:'special', tip:'Contains hazardous materials. Bring to an e-waste drop-off facility only.' },
  { id:44, name:'Printer / Scanner',      category:'electronics', status:'special', tip:'Manufacturer take-back programs often accept old printers.' },
  { id:45, name:'Cables & Cords',         category:'electronics', status:'special', tip:'Donate working cables. Take non-functional ones to e-waste collection events.' },
  { id:46, name:'Printer Cartridge',      category:'electronics', status:'special', tip:'Staples, Office Depot, and most manufacturers accept empty cartridges for recycling.' },
  { id:47, name:'CD / DVD / Blu-ray',     category:'electronics', status:'special', tip:'Many e-waste facilities accept discs. Companies like GreenDisk offer disc recycling by mail.' },

  /* ---- Food & Organic ---- */
  { id:48, name:'Fruit & Vegetable Scraps',category:'food',   status:'special',tip:'Compost in a backyard bin, city compost cart, or community garden drop-off.' },
  { id:49, name:'Coffee Grounds & Filter', category:'food',   status:'special',tip:'Excellent compost material. Also great for garden soil amendment.' },
  { id:50, name:'Eggshells',              category:'food',    status:'special',tip:'Great for compost — add calcium to soil. Crush before adding to a bin.' },
  { id:51, name:'Yard Waste (leaves/grass)',category:'food',  status:'check',  tip:'Many cities offer curbside yard waste collection. Check your local schedule.' },
  { id:52, name:'Greasy Food Container',  category:'food',    status:'no',     tip:'Grease and food residue contaminate paper/cardboard and cannot be removed at the facility.' },
  { id:53, name:'Dairy & Meat Scraps',    category:'food',    status:'special',tip:'Avoid adding to backyard compost. Accept in city compost programs or bokashi systems.' },

  /* ---- Hazardous ---- */
  { id:54, name:'House Paint',            category:'hazardous', status:'special', tip:'Many hardware stores (Home Depot, Sherwin-Williams) accept leftover paint for recycling.' },
  { id:55, name:'Motor Oil',              category:'hazardous', status:'special', tip:'Auto parts stores like AutoZone and Jiffy Lube accept used motor oil for free.' },
  { id:56, name:'Household Cleaners',     category:'hazardous', status:'special', tip:'Contact your local household hazardous waste (HHW) facility for safe disposal.' },
  { id:57, name:'Fluorescent Bulb (CFL)', category:'hazardous', status:'special', tip:'Contains mercury. Home Depot and Lowe\'s accept CFLs at the service desk.' },
  { id:58, name:'Medications / Pills',    category:'hazardous', status:'special', tip:'Use the DEA National Prescription Drug Take-Back program or in-store pharmacy kiosks.' },
  { id:59, name:'Pesticides & Herbicides',category:'hazardous', status:'special', tip:'Never pour down the drain. Bring to a HHW collection event or facility.' },

  /* ---- Batteries ---- */
  { id:60, name:'Alkaline Battery (AA/AAA)',category:'batteries',status:'check', tip:'Some states require recycling; others allow landfill disposal. Use Call2Recycle drop-offs.' },
  { id:61, name:'Lithium-Ion Battery',    category:'batteries', status:'special',tip:'Never put in bins — fire hazard. Return to retailers (Best Buy, Home Depot).' },
  { id:62, name:'Car Battery (Lead-Acid)',category:'batteries', status:'special',tip:'Auto parts stores are required by law in most states to accept old car batteries.' },
  { id:63, name:'Button Cell Battery',    category:'batteries', status:'special',tip:'Contains heavy metals. Retailers like Duracell and Energizer accept them for recycling.' },
  { id:64, name:'Rechargeable Battery',   category:'batteries', status:'special',tip:'Call2Recycle (call2recycle.org) operates thousands of drop-off locations across North America.' },

  /* ---- Textiles ---- */
  { id:65, name:'Clothing (good condition)',category:'textiles',status:'special',tip:'Donate to Goodwill, Salvation Army, or H&M\'s in-store clothing collection bin.' },
  { id:66, name:'Worn-Out Clothing',      category:'textiles', status:'special',tip:'Many brands (Patagonia, Levi\'s, Nike) accept old garments regardless of brand.' },
  { id:67, name:'Shoes',                  category:'textiles', status:'special',tip:'Nike Reuse-A-Shoe program and many thrift stores accept used footwear.' },
  { id:68, name:'Bed Sheets & Towels',    category:'textiles', status:'special',tip:'Textile recycling bins (often at supermarkets) accept household linens.' },
  { id:69, name:'Carpet / Rugs',          category:'textiles', status:'special',tip:'Carpet America Recovery Effort (CARE) has a finder for carpet recycling facilities.' },

  /* ---- Household ---- */
  { id:70, name:'Styrofoam Packing',      category:'household',status:'special',tip:'Earth911 lists drop-off locations. Some UPS and FedEx stores accept packing peanuts.' },
  { id:71, name:'Plastic Plant Pot',      category:'household',status:'check',  tip:'Rigid plastic plant pots are accepted in some programs. Rinse soil out completely.' },
  { id:72, name:'Empty Deodorant Stick',  category:'household',status:'check',  tip:'HDPE or PP body — accepted in some areas. TerraCycle offers a dedicated program.' },
  { id:73, name:'Light Bulb (LED/incand)',category:'household',status:'special',tip:'Some hardware stores accept LEDs. Incandescent bulbs go to trash (not hazardous).' },
  { id:74, name:'Disposable Razor',       category:'household',status:'special',tip:'Gillette and TerraCycle partner on a razor recycling program (free shipping kit).' },
  { id:75, name:'Tissue Box (cardboard)', category:'household',status:'yes',    tip:'Cardboard tissue boxes are readily recyclable. Remove the plastic film insert first.' },
  { id:76, name:'Packing Peanuts (foam)', category:'household',status:'special',tip:'Reuse in shipping or drop off at a local packaging/shipping store.' },
  { id:77, name:'Zip-Lock Bag (clean)',   category:'household',status:'special',tip:'Clean, dry zip-lock bags can go with film plastic to grocery store drop-offs.' },
];

/* ---------- Quiz Categories ---------- */
const QUIZ_CATEGORIES = [
  { id:'general',    name:'General Recycling',  desc:'The basics of what, why, and how to recycle', icon:'fa-recycle' },
  { id:'plastics',   name:'Plastics Deep Dive',  desc:'Resin codes, film plastics, and what goes where', icon:'fa-bottle-water' },
  { id:'paper',      name:'Paper & Cardboard',   desc:'From newspapers to greasy pizza boxes', icon:'fa-newspaper' },
  { id:'food',       name:'Food & Composting',   desc:'Organic waste, composting basics, and contamination', icon:'fa-apple-whole' },
  { id:'ewaste',     name:'E-Waste',             desc:'Electronics, batteries, and hazardous tech waste', icon:'fa-laptop' },
  { id:'mixed',      name:'Mixed Challenge',     desc:'Random questions from all categories', icon:'fa-shuffle' },
];

/* ---------- Quiz Questions ---------- */
const QUIZ_QUESTIONS = [

  /* General Recycling */
  { id:1, cat:'general', q:'What does the chasing-arrows symbol with a number (1–7) on a plastic item indicate?',
    opts:['The plastic is definitely recyclable','The type of plastic resin used','How many times it can be recycled','The item\'s environmental impact score'],
    ans:1, exp:'The resin identification code identifies the plastic type, but it does NOT mean it is recyclable everywhere.' },

  { id:2, cat:'general', q:'What is "contamination" in the context of recycling?',
    opts:['Recycling that produces toxic byproducts','Non-recyclable items placed in a recycling bin','A type of plastic that cannot be melted','Recyclables that are too small to sort'],
    ans:1, exp:'Contamination happens when wrong or dirty items are mixed with recyclables, which can cause entire loads to be sent to landfill.' },

  { id:3, cat:'general', q:'Which material is recycled at the highest rate globally?',
    opts:['Glass','PET plastic','Aluminum','Paper'],
    ans:2, exp:'Aluminum is recycled at a higher rate than any other beverage container material and can be infinitely recycled without quality loss.' },

  { id:4, cat:'general', q:'Roughly what percentage of all plastic produced globally has ever been recycled?',
    opts:['About 50%','About 30%','About 9%','About 65%'],
    ans:2, exp:'Only about 9% of all plastic ever produced has been recycled. The rest has gone to landfill, incineration, or the environment.' },

  { id:5, cat:'general', q:'What is "wishcycling"?',
    opts:['Recycling items you hope will be accepted, even if unsure','A recycling program focused on holiday waste','Sorting recycling by hand at home','Composting food items in a wish-bone shape'],
    ans:0, exp:'Wishcycling is tossing uncertain items in the recycling bin hoping they\'ll be recycled. It often causes contamination and wasted resources.' },

  { id:6, cat:'general', q:'How many times can aluminum be recycled without losing quality?',
    opts:['Up to 5 times','Up to 10 times','Up to 20 times','Infinitely'],
    ans:3, exp:'Aluminum can be recycled infinitely — there is no degradation in quality, making it one of the most valuable recyclable materials.' },

  { id:7, cat:'general', q:'What is "single-stream recycling"?',
    opts:['Recycling only one material type at a time','Putting all recyclables in one bin without sorting','Recycling in a river or stream','Melting multiple plastics together'],
    ans:1, exp:'Single-stream recycling lets residents place all recyclables in one bin. A Materials Recovery Facility (MRF) sorts them later using machines.' },

  { id:8, cat:'general', q:'Which of these items most commonly contaminates residential recycling?',
    opts:['Newspapers','Plastic bags','Aluminum cans','Glass bottles'],
    ans:1, exp:'Plastic bags jam sorting machine conveyor belts, halting operations and costing recycling facilities millions of dollars annually.' },

  { id:9, cat:'general', q:'What is "downcycling"?',
    opts:['Recycling that uses less energy','Turning a material into a lower-quality product','Sending recyclables to a landfill','Composting organic waste underground'],
    ans:1, exp:'Downcycling converts a material into something of lower value or quality — like plastic bottles becoming fleece fabric that cannot be recycled again.' },

  { id:10, cat:'general', q:'Should you leave food residue in containers before recycling them?',
    opts:['Yes — the recycling plant cleans them','No — rinse them first to prevent contamination','It does not matter either way','Only for glass containers'],
    ans:1, exp:'Food residue contaminates other recyclables and attracts pests. A quick rinse is all that\'s needed — they do not need to be spotless.' },

  { id:11, cat:'general', q:'Which is the correct order of the "3 Rs" in terms of priority?',
    opts:['Recycle, Reduce, Reuse','Reduce, Reuse, Recycle','Reuse, Recycle, Reduce','Recycle, Reuse, Reduce'],
    ans:1, exp:'Reduce first (buy less), then Reuse (use it again), then Recycle as a last resort. Recycling still requires energy and resources.' },

  { id:12, cat:'general', q:'What happens to recyclables that are collected but too contaminated to process?',
    opts:['They are washed and recycled anyway','They are sent to a landfill or incinerator','They are returned to residents','They are composted'],
    ans:1, exp:'Heavily contaminated loads are rejected and sent to landfill. This is why proper sorting and rinsing matters.' },

  /* Plastics */
  { id:13, cat:'plastics', q:'Which plastic resin code is most widely accepted for curbside recycling in the US?',
    opts:['#3 PVC','#1 PET','#6 PS (Styrofoam)','#7 Other'],
    ans:1, exp:'#1 PET (polyethylene terephthalate) — used in water and soda bottles — is accepted by virtually every curbside program.' },

  { id:14, cat:'plastics', q:'What does HDPE stand for?',
    opts:['Hard Density Polyethylene','High-Duty Plastic Element','High-Density Polyethylene','Heat-Durable Plastic Enclosure'],
    ans:2, exp:'HDPE (High-Density Polyethylene) is the #2 resin code, used for milk jugs, detergent bottles, and pipes. Widely recyclable.' },

  { id:15, cat:'plastics', q:'Why is #3 PVC plastic difficult and dangerous to recycle?',
    opts:['It melts at too high a temperature','It releases toxic chlorine gas when melted','It is too flexible to be sorted','It is too lightweight for machinery'],
    ans:1, exp:'PVC contains chlorine, which releases toxic dioxins and hydrochloric acid when melted. Even tiny amounts can contaminate a full recycling batch.' },

  { id:16, cat:'plastics', q:'Where is the correct place to recycle plastic bags (#4 LDPE film)?',
    opts:['Curbside recycling bin','Trash can','Store drop-off collection point','Compost bin'],
    ans:2, exp:'Plastic bags and film must go to in-store film recycling bins (found at most grocery and big-box stores), never curbside bins.' },

  { id:17, cat:'plastics', q:'Why is black plastic packaging almost never recycled?',
    opts:['It is made from a different chemical formula','Sorting machines use infrared light that cannot detect black pigment','It is too heavy for conveyor belts','It costs more to process than other colors'],
    ans:1, exp:'Optical sorting systems at MRFs use near-infrared (NIR) scanners that are "blind" to carbon-black pigmented plastics, so they are sorted out as contamination.' },

  { id:18, cat:'plastics', q:'What should you do with a plastic bottle cap before recycling?',
    opts:['Remove it and throw it in the trash','Leave it screwed on the bottle','Drop it separately in the bin','It does not matter'],
    ans:1, exp:'Most programs now say to leave caps on — they are too small to be sorted alone and can be captured at the facility when attached to the larger bottle.' },

  { id:19, cat:'plastics', q:'#5 Polypropylene (PP) is commonly found in which everyday item?',
    opts:['Water bottles','Yogurt containers and bottle caps','Cling wrap','Styrofoam cups'],
    ans:1, exp:'PP (#5) is used for yogurt tubs, bottle caps, straws, and medicine bottles. Its acceptance in curbside programs has grown significantly.' },

  { id:20, cat:'plastics', q:'What is the primary concern with mixing different plastic types during recycling?',
    opts:['They have different colors','Different plastics have different melting points and are incompatible','They attract pests','They are too heavy together'],
    ans:1, exp:'Different resins melt at different temperatures and are chemically incompatible. Mixing them produces weak, unusable materials.' },

  { id:21, cat:'plastics', q:'Which plastic type is most commonly used to make fleece jackets from recycled content?',
    opts:['#2 HDPE','#4 LDPE','#1 PET','#5 PP'],
    ans:2, exp:'Recycled PET (#1) from plastic bottles is one of the most common sources for recycled polyester used in fleece, clothing, and carpet.' },

  { id:22, cat:'plastics', q:'What is a "compostable" plastic bag actually made from?',
    opts:['Recycled PET','Plant-based starches or PLA','Biodegradable petroleum plastic','Hemp fiber'],
    ans:1, exp:'Compostable plastics are usually made from PLA (polylactic acid) derived from corn starch or sugarcane — but require industrial composting conditions.' },

  /* Paper & Cardboard */
  { id:23, cat:'paper', q:'Why is a greasy pizza box problematic for paper recycling?',
    opts:['The cardboard is too thick','Grease bonds with paper fibers and creates weak, unusable recycled paper','The heat from the oven changes the cardboard chemistry','It is made with a different type of cardboard'],
    ans:1, exp:'Grease cannot be separated from paper fibers during the recycling process, creating weakened pulp that ruins entire batches of paper recycling.' },

  { id:24, cat:'paper', q:'Why are most paper coffee cups NOT recyclable in curbside bins?',
    opts:['They are made from special imported paper','They have a thin plastic/polyethylene lining that cannot be easily separated','They are too small for sorting machines','They always contain coffee residue'],
    ans:1, exp:'Paper cups have a polyethylene plastic lining fused to the paper to make them waterproof. Separating the two materials requires specialized equipment.' },

  { id:25, cat:'paper', q:'What should you do to cardboard boxes before recycling?',
    opts:['Leave them as-is','Flatten them, remove tape and foam inserts','Cut them into small pieces','Rinse them with water'],
    ans:1, exp:'Flattening boxes saves space in bins and trucks. Tape won\'t ruin the batch, but foam peanuts and inserts must be removed as they contaminate the load.' },

  { id:26, cat:'paper', q:'Can shredded paper be placed loose in a curbside recycling bin?',
    opts:['Yes, always','No, never — shredded paper must be bagged','It depends — many programs prefer it in a paper bag or stapled envelope','Only if it is white paper'],
    ans:2, exp:'Loose shreds blow away and jam machines. Many programs ask you to contain shredded paper in a paper bag or envelope so it stays together during sorting.' },

  { id:27, cat:'paper', q:'Which of these is NOT recyclable in standard paper recycling?',
    opts:['Brown paper bag','Newspaper','Wax paper','Cardboard cereal box'],
    ans:2, exp:'Wax paper has a wax coating that cannot be separated from the paper fibers, making it incompatible with paper recycling streams.' },

  { id:28, cat:'paper', q:'What does "virgin fiber" mean in paper production?',
    opts:['Paper made from sustainably harvested forests','Paper made from newly cut trees, not recycled content','Paper that has never been printed on','Unbleached, natural-color paper'],
    ans:1, exp:'Virgin fiber comes from freshly harvested wood pulp. Recycled paper uses recovered fiber instead, saving trees, water, and energy.' },

  /* Food & Composting */
  { id:29, cat:'food', q:'What is composting?',
    opts:['A type of plastic-free packaging','The biological decomposition of organic matter into nutrient-rich soil amendment','A process for recycling food containers','A government food waste tax program'],
    ans:1, exp:'Composting breaks down organic material (food scraps, yard waste) through microbial activity, creating humus — a natural fertilizer for soil.' },

  { id:30, cat:'food', q:'Which of these items should NOT go into a standard backyard compost bin?',
    opts:['Vegetable peels','Coffee grounds','Meat and dairy products','Eggshells'],
    ans:2, exp:'Meat and dairy attract pests and create odors in backyard bins. They should go in a city compost cart (industrial composting) or bokashi system.' },

  { id:31, cat:'food', q:'Why does food contamination on recyclables matter so much?',
    opts:['It adds too much weight to the load','It attracts animals to recycling trucks','It breeds bacteria that destroy paper and plastic fibers during processing','Recycling facilities cannot accept food for legal reasons'],
    ans:2, exp:'During paper recycling, the pulping process is undermined by fats and oils. In plastic recycling, contamination weakens the final recycled material.' },

  { id:32, cat:'food', q:'What is "vermiculture"?',
    opts:['Composting using red worms (worm bins)','A type of urban recycling program','Growing food vertically in cities','A method of shredding food waste'],
    ans:0, exp:'Vermiculture uses red worms (Eisenia fetida) to break down food scraps into worm castings — one of the richest organic fertilizers available.' },

  { id:33, cat:'food', q:'Which food scrap is best avoided in compost due to its effect on soil pH?',
    opts:['Citrus peels in excess','Eggshells','Coffee grounds','Dry leaves'],
    ans:0, exp:'Too many citrus peels can make compost more acidic. Use in moderation, or balance with alkaline materials like eggshells or wood ash.' },

  /* E-Waste */
  { id:34, cat:'ewaste', q:'What does "e-waste" mean?',
    opts:['Excessive use of online streaming','Discarded electronic devices and components','Electricity generated by landfill gas','Errors in electronic recycling software'],
    ans:1, exp:'E-waste (electronic waste) refers to discarded electronics: phones, computers, TVs, batteries, and anything with a circuit board or cord.' },

  { id:35, cat:'ewaste', q:'Why is it important to recycle old electronics rather than throwing them in the trash?',
    opts:['Electronics contain gold and are expensive to replace','Electronics contain lead, mercury, and cadmium that leach into groundwater','Electronics are too bulky for landfills','It is required by federal law everywhere'],
    ans:1, exp:'E-waste contains hazardous heavy metals. When landfilled, these leach into soil and groundwater, causing serious environmental and health risks.' },

  { id:36, cat:'ewaste', q:'Which valuable metal is recovered from recycled smartphones?',
    opts:['Iron and copper only','Gold, silver, and palladium','Aluminum only','Steel and zinc'],
    ans:1, exp:'A single ton of circuit boards contains 40–800x more gold than a ton of ore. Smartphones contain gold, silver, palladium, platinum, and rare earth elements.' },

  { id:37, cat:'ewaste', q:'Why should lithium-ion batteries NEVER be placed in curbside recycling bins?',
    opts:['They are too heavy for the trucks','They can spark fires in sorting facilities and garbage trucks','They are not made of recyclable materials','They damage plastic sorting equipment'],
    ans:1, exp:'Damaged or punctured lithium-ion batteries can ignite. Battery fires at recycling facilities have caused millions in damage and multiple fatalities.' },

  { id:38, cat:'ewaste', q:'Where is the best place to recycle an old working laptop?',
    opts:['Throw it in the trash if it\'s old','A certified e-waste recycler, retailer take-back program, or donate it','Drop it in the curbside recycling bin','Pour water on it first, then trash it'],
    ans:1, exp:'Working electronics can be donated to schools or nonprofits. For recycling, certified e-Stewards or R2-certified recyclers ensure responsible processing.' },

  { id:39, cat:'ewaste', q:'What should you do before recycling a smartphone?',
    opts:['Remove the SIM card only','Do nothing — the recycler handles it','Factory reset it to erase personal data, remove SIM and SD cards','Smash the screen to make sorting easier'],
    ans:2, exp:'Always factory reset your device to protect personal data. Remove your SIM and SD cards. Back up any data you want to keep beforehand.' },

  { id:40, cat:'ewaste', q:'Which program operates thousands of battery recycling drop-off locations across North America?',
    opts:['TerraCycle','GreenDisk','Call2Recycle','Earth911'],
    ans:2, exp:'Call2Recycle (call2recycle.org) operates over 16,000 battery recycling drop-off points at retailers and municipal locations across the US and Canada.' },
];

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = [
  { id:'first_quiz',    name:'First Step',        desc:'Complete your very first quiz',                   icon:'🌱', req: q => q.quizzes >= 1 },
  { id:'perfect',       name:'Perfect Score',      desc:'Answer all 10 questions correctly in one quiz',   icon:'🏆', req: q => q.lastPerfect },
  { id:'streak5',       name:'On Fire',            desc:'Get a 5-answer streak in a single quiz',          icon:'🔥', req: q => q.bestStreak >= 5 },
  { id:'quizzes5',      name:'Knowledge Seeker',   desc:'Complete 5 quizzes',                              icon:'📚', req: q => q.quizzes >= 5 },
  { id:'quizzes10',     name:'Dedicated Learner',  desc:'Complete 10 quizzes',                             icon:'🎓', req: q => q.quizzes >= 10 },
  { id:'pts500',        name:'500 Club',           desc:'Earn 500 total points',                           icon:'⭐', req: q => q.totalPoints >= 500 },
  { id:'pts1000',       name:'Point Millionaire',  desc:'Earn 1,000 total points',                         icon:'💎', req: q => q.totalPoints >= 1000 },
  { id:'all_cats',      name:'All-Rounder',        desc:'Complete every quiz category at least once',      icon:'🌍', req: q => q.catsPlayed && q.catsPlayed.size >= 5 },
  { id:'friend_added',  name:'Social Recycler',    desc:'Add your first friend',                           icon:'🤝', req: q => q.friendsAdded >= 1 },
  { id:'streak10',      name:'Unstoppable',        desc:'Get a 10-answer streak across your quiz history', icon:'⚡', req: q => q.bestStreak >= 10 },
];

/* ---------- Avatars ---------- */
// Indices 0-9: free. Indices 10-17: unlocked with points (see AVATAR_UNLOCKS).
const AVATARS = [
  '🌱','🌿','♻️','🌍','🌊','🦋','🌻','🍃','🌳','💚',  // free
  '🦝','🐸','🌵','🦉','🐬','🌈','⭐','🏆',             // unlocked
];

const AVATAR_UNLOCKS = { 10:150, 11:300, 12:500, 13:750, 14:1000, 15:1500, 16:2500, 17:4000 };

/* ---------- Titles (unlocked by points) ---------- */
const TITLES = [
  { id:'newcomer',   label:'Newcomer',          pts:0    },
  { id:'recycler',   label:'Recycler',           pts:100  },
  { id:'greenthumb', label:'Green Thumb',        pts:300  },
  { id:'warrior',    label:'Eco Warrior',        pts:700  },
  { id:'guardian',   label:'Planet Guardian',    pts:1500 },
  { id:'legend',     label:'Recycling Legend',   pts:3000 },
];

/* ---------- Packaging → Recyclability Map (for Scanner) ---------- */
const PACKAGING_MAP = {
  // Recyclable
  'cardboard':        { verdict:'recyclable',     label:'Cardboard',         tips:['Flatten before recycling.'] },
  'paper':            { verdict:'recyclable',     label:'Paper',             tips:['Ensure it is clean and dry.'] },
  'kraft paper':      { verdict:'recyclable',     label:'Kraft Paper',       tips:['Widely accepted in paper recycling.'] },
  'glass':            { verdict:'recyclable',     label:'Glass',             tips:['Rinse and remove the lid.'] },
  'aluminium':        { verdict:'recyclable',     label:'Aluminium',         tips:['Rinse and crush to save space.'] },
  'aluminum':         { verdict:'recyclable',     label:'Aluminum',          tips:['Rinse and crush to save space.'] },
  'steel':            { verdict:'recyclable',     label:'Steel',             tips:['Rinse food residue before recycling.'] },
  'tin':              { verdict:'recyclable',     label:'Tin/Steel',         tips:['Rinse and recycle with metals.'] },
  'hdpe':             { verdict:'recyclable',     label:'HDPE (#2 Plastic)', tips:['Widely accepted curbside.'] },
  'pet':              { verdict:'recyclable',     label:'PET (#1 Plastic)',  tips:['Rinse and leave cap on.'] },
  'pp':               { verdict:'recyclable',     label:'PP (#5 Plastic)',   tips:['Check your local program.'] },
  // Check locally
  'plastic':          { verdict:'check-local',    label:'Plastic',           tips:['Check the resin code and your local program.'] },
  'pvc':              { verdict:'check-local',    label:'PVC (#3 Plastic)',  tips:['Rarely accepted — check locally.'] },
  'ldpe':             { verdict:'check-local',    label:'LDPE (#4 Plastic)', tips:['Film plastics go to store drop-off.'] },
  'composite':        { verdict:'check-local',    label:'Composite Material',tips:['Mixed materials are hard to recycle — check locally.'] },
  'multilayer':       { verdict:'check-local',    label:'Multi-layer',       tips:['Multi-layer packaging is rarely recyclable.'] },
  'sleeve':           { verdict:'check-local',    label:'Plastic Sleeve',    tips:['Remove sleeve and recycle separately if possible.'] },
  // Not recyclable
  'styrofoam':        { verdict:'not-recyclable', label:'Styrofoam/EPS',     tips:['Not accepted curbside. Find a specialty foam drop-off.'] },
  'polystyrene':      { verdict:'not-recyclable', label:'Polystyrene (#6)',  tips:['Rarely recyclable — look for specialty programs.'] },
  'blister':          { verdict:'not-recyclable', label:'Blister Pack',      tips:['Mixed plastic/foil blister packs are not recyclable.'] },
  'foil':             { verdict:'not-recyclable', label:'Foil/Metalized Film',tips:['Metalized foil cannot be recycled curbside.'] },
  'film':             { verdict:'not-recyclable', label:'Plastic Film',      tips:['Soft film plastics go to store film recycling only.'] },
  'sachet':           { verdict:'not-recyclable', label:'Sachet',            tips:['Single-use sachets are generally not recyclable.'] },
  'bioplastic':       { verdict:'not-recyclable', label:'Bioplastic/PLA',    tips:['Needs industrial composting — not home compost or recycling.'] },
  'tetra':            { verdict:'not-recyclable', label:'Tetra Pak',         tips:['Requires special processing. Check if your city accepts them.'] },
  'wax':              { verdict:'not-recyclable', label:'Wax Coating',       tips:['Wax coating prevents paper recycling.'] },
};
