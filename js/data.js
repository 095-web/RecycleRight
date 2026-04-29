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
  { id:3,  name:'Office / Printer Paper', category:'paper',    status:'yes',    tip:'Shredded paper is usually OK; check with your local program.' },
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
  { id:17, name:'#4 LDPE Plastic Bag',     category:'plastics', status:'special',tip:'Never put in curbside bins; bags jam sorting machinery. Drop off at grocery store collection points.' },
  { id:18, name:'#5 PP Yogurt Container',  category:'plastics', status:'check', tip:'PP acceptance is growing. Check your local program.' },
  { id:19, name:'#6 PS Foam Cup/Plate',    category:'plastics', status:'no',    tip:'Polystyrene foam (Styrofoam) is rarely accepted. Look for specialty foam recyclers.' },
  { id:20, name:'#6 PS Plastic Cutlery',   category:'plastics', status:'no',    tip:'Too small for sorting machinery. Switch to reusable or compostable alternatives.' },
  { id:21, name:'#7 Other Plastics',       category:'plastics', status:'no',    tip:'This catch-all category is rarely recyclable curbside. Check the label.' },
  { id:22, name:'Plastic Straw',           category:'plastics', status:'no',    tip:'Too small and lightweight for sorters. Switch to paper, metal, or silicone straws.' },
  { id:23, name:'Plastic Bottle Cap',      category:'plastics', status:'check', tip:'Many programs now accept caps on the bottle. Check locally; some collect them separately.' },
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
  { id:50, name:'Eggshells',              category:'food',    status:'special',tip:'Great for compost; add calcium to soil. Crush before adding to a bin.' },
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
  { id:61, name:'Lithium-Ion Battery',    category:'batteries', status:'special',tip:'Never put in bins. Fire hazard. Return to retailers (Best Buy, Home Depot).' },
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
  { id:72, name:'Empty Deodorant Stick',  category:'household',status:'check',  tip:'HDPE or PP body; accepted in some areas. TerraCycle offers a dedicated program.' },
  { id:73, name:'Light Bulb (LED/incand)',category:'household',status:'special',tip:'Some hardware stores accept LEDs. Incandescent bulbs go to trash (not hazardous).' },
  { id:74, name:'Disposable Razor',       category:'household',status:'special',tip:'Gillette and TerraCycle partner on a razor recycling program (free shipping kit).' },
  { id:75, name:'Tissue Box (cardboard)', category:'household',status:'yes',    tip:'Cardboard tissue boxes are readily recyclable. Remove the plastic film insert first.' },
  { id:76, name:'Packing Peanuts (foam)', category:'household',status:'special',tip:'Reuse in shipping or drop off at a local packaging/shipping store.' },
  { id:77, name:'Zip-Lock Bag (clean)',   category:'household',status:'special',tip:'Clean, dry zip-lock bags can go with film plastic to grocery store drop-offs.' },

  /* ---- More Glass ---- */
  { id:78, name:'Glass Baking Dish (Pyrex)', category:'glass', status:'no',    tip:'Pyrex and borosilicate glass have a different composition from bottles; they contaminate glass recycling batches.' },
  { id:79, name:'Glass Vase',                category:'glass', status:'check', tip:'Clear glass vases can go with glass bottles in many programs. Check your local guidelines.' },
  { id:80, name:'Glass Candle Jar',          category:'glass', status:'yes',   tip:'Clean out wax residue with hot water, remove the wick, then recycle like any glass jar.' },

  /* ---- More Metals ---- */
  { id:81, name:'Empty Paint Can (metal)',  category:'metals',  status:'special', tip:'Let the paint fully dry or harden before disposal. Many hardware stores accept empty metal paint cans.' },
  { id:82, name:'Stainless Steel Cookware', category:'metals',  status:'special', tip:'Not curbside; take to a scrap metal dealer or donation center if still usable.' },
  { id:83, name:'Metal Baking Pan',          category:'metals',  status:'yes',    tip:'Clean aluminum or steel baking pans are generally accepted in curbside metal recycling.' },
  { id:84, name:'Aluminum Pie Tin',          category:'metals',  status:'yes',    tip:'Rinse and flatten. Aluminum trays are widely accepted; ball up small ones with foil.' },
  { id:85, name:'Steel Bottle Cap',          category:'metals',  status:'yes',    tip:'Place several caps inside a steel can and crimp the top closed so they don\'t fall through sorting screens.' },

  /* ---- More Electronics ---- */
  { id:86, name:'Smart Speaker / Echo',     category:'electronics', status:'special', tip:'Manufacturers like Amazon and Google offer take-back or recycling programs for smart devices.' },
  { id:87, name:'Gaming Console',           category:'electronics', status:'special', tip:'Best Buy and manufacturer trade-in programs accept consoles. Working units can be donated.' },
  { id:88, name:'External Hard Drive / SSD',category:'electronics', status:'special', tip:'Wipe data before recycling. Best Buy, Staples, and e-waste facilities accept drives.' },
  { id:89, name:'Power Bank',               category:'batteries',   status:'special', tip:'Contains lithium-ion cells. Never curbside. Return to the retailer or a battery recycling location.' },

  /* ---- More Plastics ---- */
  { id:90, name:'Styrofoam Takeout Box',    category:'plastics', status:'no',      tip:'EPS foam is not accepted curbside. Look for specialty foam drop-off programs or Earth911 locations.' },
  { id:91, name:'Plastic Produce Bag',      category:'plastics', status:'special', tip:'Thin film; bring clean and dry to grocery store film-plastic drop-off bins.' },
  { id:92, name:'Reusable Plastic Container (PP)', category:'plastics', status:'check', tip:'#5 PP containers are increasingly accepted curbside. Rinse thoroughly and check locally.' },
  { id:93, name:'Plastic Pill Bottle',      category:'plastics', status:'check',   tip:'Many pharmacies and retailers (Whole Foods, Gimme 5) collect #5 PP pill bottles for recycling.' },
  { id:94, name:'Single-Use K-Cup',         category:'plastics', status:'special', tip:'Keurig has a take-back program. Remove grounds and foil lid; some may be #5 PP recyclable locally.' },

  /* ---- More Paper ---- */
  { id:95, name:'Gift Wrapping Paper',      category:'paper',    status:'check',   tip:'Plain paper wrapping is recyclable; foil, glitter, or laminated wrap is not. Do the scrunch test.' },
  { id:96, name:'Paper Straw',              category:'paper',    status:'no',      tip:'Too small and wet-contaminated for paper recycling. Compost if unbleached, otherwise trash.' },
  { id:97, name:'Cardboard Coffee Sleeve',  category:'paper',    status:'yes',     tip:'Cardboard sleeves are plain corrugated paper and recyclable. Remove any plastic or foil elements.' },

  /* ---- More Food ---- */
  { id:98, name:'Cooking Oil (used)',       category:'hazardous', status:'special', tip:'Never pour down the drain. Many grocery stores, restaurants, and transfer stations collect used cooking oil.' },
  { id:99, name:'Compostable Cutlery (PLA)',category:'plastics',  status:'special', tip:'PLA cutlery requires industrial composting at high heat. Do NOT put in curbside recycling or home compost.' },

  /* ---- More Household ---- */
  { id:100, name:'Nail Polish',             category:'hazardous', status:'special', tip:'Considered hazardous waste. Bring to a local HHW event. Some salons also collect old polish.' },
  { id:101, name:'Broken Ceramic / Pottery',category:'household',  status:'no',     tip:'Ceramics are not recyclable and contaminate glass recycling. Wrap carefully and dispose in trash.' },
  { id:102, name:'Foam Mattress / Memory Foam', category:'household', status:'special', tip:'Mattress Firm and local recycling centers often accept mattresses. Foam can be shredded for carpet padding.' },
  { id:103, name:'Reusable Shopping Bag (woven PP)', category:'plastics', status:'no', tip:'Woven polypropylene bags are not curbside recyclable but are durable; keep reusing them!' },
  { id:104, name:'Single-Use Coffee Pod (aluminum)', category:'metals', status:'special', tip:'Nespresso runs a dedicated take-back program for aluminum pods. Collect in the return bag and drop off.' },

  /* ---- Textiles ---- */
  { id:105, name:'Denim Jeans',             category:'textiles', status:'special', tip:'Levi\'s runs an in-store denim recycling program. Many textile bins also accept old jeans.' },
  { id:106, name:'Athletic Wear (synthetic)',category:'textiles', status:'special', tip:'Patagonia, Nike, and Adidas have take-back programs for worn synthetic athletic wear.' },
  { id:107, name:'Stuffed Animals / Plush', category:'textiles', status:'special', tip:'Donate if clean. Some animal shelters accept stuffed animals for enrichment for animals in care.' },
];

/* ---------- Quiz Categories ---------- */
const QUIZ_CATEGORIES = [
  { id:'general',    name:'General Recycling',  desc:'The basics of what, why, and how to recycle', icon:'fa-recycle' },
  { id:'plastics',   name:'Plastics Deep Dive',  desc:'Resin codes, film plastics, and what goes where', icon:'fa-bottle-water' },
  { id:'paper',      name:'Paper & Cardboard',   desc:'From newspapers to greasy pizza boxes', icon:'fa-newspaper' },
  { id:'food',       name:'Food & Composting',   desc:'Organic waste, composting basics, and contamination', icon:'fa-apple-whole' },
  { id:'ewaste',     name:'E-Waste',             desc:'Electronics, batteries, and hazardous tech waste', icon:'fa-laptop' },
  { id:'myths',      name:'Myth Busters',        desc:'True or false? Bust common recycling myths', icon:'fa-circle-question' },
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
    opts:['Putting unsure items in the bin and hoping they get recycled','A special recycling program for holiday-season waste','Manually sorting your own recyclables at home by material','A composting method that uses wishbone-shaped containers'],
    ans:0, exp:'Wishcycling is tossing uncertain items in the recycling bin hoping they\'ll be recycled. It often causes contamination and wasted resources.' },

  { id:6, cat:'general', q:'How many times can aluminum be recycled without losing quality?',
    opts:['Up to 5 times','Up to 10 times','Up to 20 times','Infinitely'],
    ans:3, exp:'Aluminum can be recycled infinitely with no degradation in quality, making it one of the most valuable recyclable materials.' },

  { id:7, cat:'general', q:'What is "single-stream recycling"?',
    opts:['Recycling only one material type at a time','Putting all recyclables in one bin without sorting','Recycling in a river or stream','Melting multiple plastics together'],
    ans:1, exp:'Single-stream recycling lets residents place all recyclables in one bin. A Materials Recovery Facility (MRF) sorts them later using machines.' },

  { id:8, cat:'general', q:'Which of these items most commonly contaminates residential recycling?',
    opts:['Newspapers','Plastic bags','Aluminum cans','Glass bottles'],
    ans:1, exp:'Plastic bags jam sorting machine conveyor belts, halting operations and costing recycling facilities millions of dollars annually.' },

  { id:9, cat:'general', q:'What is "downcycling"?',
    opts:['Recycling that uses less energy','Turning a material into a lower-quality product','Sending recyclables to a landfill','Composting organic waste underground'],
    ans:1, exp:'Downcycling converts a material into something of lower value or quality, like plastic bottles becoming fleece fabric that cannot be recycled again.' },

  { id:10, cat:'general', q:'Should you leave food residue in containers before recycling them?',
    opts:['Yes, the recycling plant cleans them','No, rinse them first to prevent contamination','It does not matter either way','Only for glass containers'],
    ans:1, exp:'Food residue contaminates other recyclables and attracts pests. A quick rinse is all that\'s needed; they do not need to be spotless.' },

  { id:11, cat:'general', q:'Which is the correct order of the "3 Rs" in terms of priority?',
    opts:['Recycle, Reduce, Reuse','Reduce, Reuse, Recycle','Reuse, Recycle, Reduce','Recycle, Reuse, Reduce'],
    ans:1, exp:'Reduce first (buy less), then Reuse (use it again), then Recycle as a last resort. Recycling still requires energy and resources.' },

  { id:12, cat:'general', q:'What happens to recyclables that are collected but too contaminated to process?',
    opts:['They are washed and recycled anyway','They are sent to a landfill or incinerator','They are returned to residents','They are composted'],
    ans:1, exp:'Heavily contaminated loads are rejected and sent to landfill. This is why proper sorting and rinsing matters.' },

  /* Plastics */
  { id:13, cat:'plastics', q:'Which plastic resin code is most widely accepted for curbside recycling in the US?',
    opts:['#3 PVC','#1 PET','#6 PS (Styrofoam)','#7 Other'],
    ans:1, exp:'#1 PET (polyethylene terephthalate), used in water and soda bottles, is accepted by virtually every curbside program.' },

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
    ans:1, exp:'Most programs now say to leave caps on. They are too small to be sorted alone and can be captured at the facility when attached to the larger bottle.' },

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
    ans:1, exp:'Compostable plastics are usually made from PLA (polylactic acid) derived from corn starch or sugarcane, but require industrial composting conditions.' },

  /* Paper & Cardboard */
  { id:23, cat:'paper', q:'Why is a greasy pizza box problematic for paper recycling?',
    opts:['The cardboard is too thick to feed into pulping machines','Grease bonds to paper fibers and cannot be removed during recycling','High oven heat permanently alters the cardboard\'s chemical structure','Pizza boxes use a wax-coated cardboard not found in other products'],
    ans:1, exp:'Grease cannot be separated from paper fibers during the recycling process, creating weakened pulp that ruins entire batches of paper recycling.' },

  { id:24, cat:'paper', q:'Why are most paper coffee cups NOT recyclable in curbside bins?',
    opts:['They are manufactured from a specially imported non-standard paper','A thin plastic lining is fused to the paper and cannot be separated','They are designed too small for standard sorting machinery','They always arrive at the facility with liquid coffee residue'],
    ans:1, exp:'Paper cups have a polyethylene plastic lining fused to the paper to make them waterproof. Separating the two materials requires specialized equipment.' },

  { id:25, cat:'paper', q:'What should you do to cardboard boxes before recycling?',
    opts:['Leave them as-is','Flatten them, remove tape and foam inserts','Cut them into small pieces','Rinse them with water'],
    ans:1, exp:'Flattening boxes saves space in bins and trucks. Tape won\'t ruin the batch, but foam peanuts and inserts must be removed as they contaminate the load.' },

  { id:26, cat:'paper', q:'Can shredded paper be placed loose in a curbside recycling bin?',
    opts:['Yes, always','No, shredded paper must be bagged separately','It depends; many programs prefer it in a paper bag or stapled envelope','Only if it is white paper'],
    ans:2, exp:'Loose shreds blow away and jam machines. Many programs ask you to contain shredded paper in a paper bag or envelope so it stays together during sorting.' },

  { id:27, cat:'paper', q:'Which of these is NOT recyclable in standard paper recycling?',
    opts:['Brown paper bag','Newspaper','Wax paper','Cardboard cereal box'],
    ans:2, exp:'Wax paper has a wax coating that cannot be separated from the paper fibers, making it incompatible with paper recycling streams.' },

  { id:28, cat:'paper', q:'What does "virgin fiber" mean in paper production?',
    opts:['Paper made from sustainably harvested forests','Paper made from newly cut trees, not recycled content','Paper that has never been printed on','Unbleached, natural-color paper'],
    ans:1, exp:'Virgin fiber comes from freshly harvested wood pulp. Recycled paper uses recovered fiber instead, saving trees, water, and energy.' },

  /* Food & Composting */
  { id:29, cat:'food', q:'What is composting?',
    opts:['A method of producing plastic-free packaging from plant-based materials','The breakdown of organic matter into nutrient-rich soil amendment','A sorting process for separating and cleaning reusable food containers','A government program that taxes businesses for generating excess food waste'],
    ans:1, exp:'Composting breaks down organic material (food scraps, yard waste) through microbial activity, creating humus, a natural fertilizer for soil.' },

  { id:30, cat:'food', q:'Which of these items should NOT go into a standard backyard compost bin?',
    opts:['Vegetable peels','Coffee grounds','Meat and dairy products','Eggshells'],
    ans:2, exp:'Meat and dairy attract pests and create odors in backyard bins. They should go in a city compost cart (industrial composting) or bokashi system.' },

  { id:31, cat:'food', q:'Why does food contamination on recyclables matter so much?',
    opts:['It adds too much weight and increases transport fuel costs for collection trucks','It attracts animals and pests that damage recycling trucks and sorting equipment','It breeds bacteria that destroy paper and plastic fibers during processing','Recycling facilities are legally prohibited from accepting any food-contaminated materials'],
    ans:2, exp:'During paper recycling, the pulping process is undermined by fats and oils. In plastic recycling, contamination weakens the final recycled material.' },

  { id:32, cat:'food', q:'What is "vermiculture"?',
    opts:['Composting using red worms (worm bins)','A type of urban recycling program','Growing food vertically in cities','A method of shredding food waste'],
    ans:0, exp:'Vermiculture uses red worms (Eisenia fetida) to break down food scraps into worm castings, one of the richest organic fertilizers available.' },

  { id:33, cat:'food', q:'Which food scrap is best avoided in compost due to its effect on soil pH?',
    opts:['Citrus peels in excess','Eggshells crushed finely','Coffee grounds and filters','Dry autumn leaves'],
    ans:0, exp:'Too many citrus peels can make compost more acidic. Use in moderation, or balance with alkaline materials like eggshells or wood ash.' },

  /* E-Waste */
  { id:34, cat:'ewaste', q:'What does "e-waste" mean?',
    opts:['Excessive use of online streaming','Discarded electronic devices and components','Electricity generated by landfill gas','Errors in electronic recycling software'],
    ans:1, exp:'E-waste (electronic waste) refers to discarded electronics: phones, computers, TVs, batteries, and anything with a circuit board or cord.' },

  { id:35, cat:'ewaste', q:'Why is it important to recycle old electronics rather than throwing them in the trash?',
    opts:['Electronics hold gold and silver that recyclers pay you to recover','They contain lead, mercury, and cadmium that leach into groundwater','Electronics are physically too bulky to fit in standard landfill cells','Federal law universally prohibits landfilling electronics in the US'],
    ans:1, exp:'E-waste contains hazardous heavy metals. When landfilled, these leach into soil and groundwater, causing serious environmental and health risks.' },

  { id:36, cat:'ewaste', q:'Which valuable metal is recovered from recycled smartphones?',
    opts:['Iron and copper only','Gold, silver, and palladium','Aluminum only','Steel and zinc'],
    ans:1, exp:'A single ton of circuit boards contains 40–800x more gold than a ton of ore. Smartphones contain gold, silver, palladium, platinum, and rare earth elements.' },

  { id:37, cat:'ewaste', q:'Why should lithium-ion batteries NEVER be placed in curbside recycling bins?',
    opts:['Their weight exceeds the load limit of standard collection trucks','They can spark fires that destroy sorting facilities and trucks','The cells are constructed from entirely non-recyclable materials','Their casing damages the plastic conveyor belts used for sorting'],
    ans:1, exp:'Damaged or punctured lithium-ion batteries can ignite. Battery fires at recycling facilities have caused millions in damage and multiple fatalities.' },

  { id:38, cat:'ewaste', q:'Where is the best place to recycle an old working laptop?',
    opts:['Throw it in the trash if it\'s old','A certified e-waste recycler, retailer take-back program, or donate it','Drop it in the curbside recycling bin','Pour water on it first, then trash it'],
    ans:1, exp:'Working electronics can be donated to schools or nonprofits. For recycling, certified e-Stewards or R2-certified recyclers ensure responsible processing.' },

  { id:39, cat:'ewaste', q:'What should you do before recycling a smartphone?',
    opts:['Only remove the SIM card; the rest is the recycler\'s job','Do nothing; certified recyclers handle all data wiping for you','Factory reset it, back up your data, and remove the SIM and SD cards','Smash the screen so the facility can disassemble it more easily'],
    ans:2, exp:'Always factory reset your device to protect personal data. Remove your SIM and SD cards. Back up any data you want to keep beforehand.' },

  { id:40, cat:'ewaste', q:'Which program operates thousands of battery recycling drop-off locations across North America?',
    opts:['TerraCycle','GreenDisk','Call2Recycle','Earth911'],
    ans:2, exp:'Call2Recycle (call2recycle.org) operates over 16,000 battery recycling drop-off points at retailers and municipal locations across the US and Canada.' },

  /* General — extra pool */
  { id:41, cat:'general', q:'What is the "circular economy"?',
    opts:['An economy that avoids all imports','A system where products are kept in use as long as possible through reuse, repair, and recycling','A model where all goods are circular in shape','A financial system that reinvests profits into green energy'],
    ans:1, exp:'The circular economy contrasts with the traditional linear "make, use, dispose" model by designing out waste and keeping materials in use as long as possible.' },

  { id:42, cat:'general', q:'What does "MRF" stand for in recycling?',
    opts:['Material Regulation Facility','Mixed Refuse Furnace','Materials Recovery Facility','Multi-Resource Foundation'],
    ans:2, exp:'A Materials Recovery Facility (MRF) receives, sorts, processes, and prepares recyclable materials for sale to manufacturers.' },

  { id:43, cat:'general', q:'Which of the following takes the longest to decompose in a landfill?',
    opts:['Paper bag','Aluminum can','Glass bottle','Plastic bag'],
    ans:2, exp:'Glass is made from silica that does not biodegrade. It is estimated to take over 1 million years to decompose in a landfill, making recycling critical.' },

  { id:44, cat:'general', q:'What is a "deposit return scheme" (DRS)?',
    opts:['A bank program for green investments','Consumers pay a small deposit on containers and get it back when they return them for recycling','A government subsidy for recycling companies','A system where businesses deposit recyclables at government centers'],
    ans:1, exp:'Deposit return schemes (bottle bills) dramatically boost recycling rates. States with bottle bills achieve up to 80–90% return rates for beverage containers.' },

  { id:45, cat:'general', q:'Recycling one ton of paper saves approximately how many trees?',
    opts:['3–5 trees','7–10 trees','17 trees','50 trees'],
    ans:2, exp:'Recycling one ton of paper saves approximately 17 trees, 7,000 gallons of water, and 380 gallons of oil, while reducing greenhouse gas emissions.' },

  { id:46, cat:'general', q:'What is "upcycling"?',
    opts:['Increasing recycling targets by law','Transforming waste into something of higher quality or value','Recycling the same material multiple times','Sending recyclables to be processed abroad'],
    ans:1, exp:'Upcycling converts waste into products of greater value, like turning wine bottles into glasses, old jeans into bags, or pallet wood into furniture.' },

  { id:47, cat:'general', q:'Which country consistently ranks among the top nations for recycling percentage?',
    opts:['United States','Japan','Germany','Australia'],
    ans:2, exp:'Germany consistently leads globally, recycling and composting over 65% of its municipal waste through strict separation rules, deposit systems, and producer responsibility laws.' },

  { id:48, cat:'general', q:'What does "post-consumer recycled content" (PCR) mean on a product label?',
    opts:['The product was made in a recycling facility','It contains material recovered after use by real consumers, not just manufacturing offcuts','The product can be recycled after use','The product was tested by consumers before manufacture'],
    ans:1, exp:'PCR content means the material was recovered from consumer use streams (bottles, paper, etc.). "Pre-consumer" waste is manufacturing scrap, which is a lower bar.' },

  { id:49, cat:'general', q:'How much energy does recycling aluminum save compared to making it from raw ore?',
    opts:['About 10%','About 40%','About 75%','About 95%'],
    ans:3, exp:'Recycling aluminum uses up to 95% less energy than smelting new aluminum from bauxite ore. A recycled can can be back on shelves in as little as 60 days.' },

  { id:50, cat:'general', q:'What does the Green Dot symbol (two interlocking arrows) on packaging mean?',
    opts:['The product is recyclable','The manufacturer financially contributes to a recycling program in their country','The product contains recycled content','The packaging must be recycled by law'],
    ans:1, exp:'The Green Dot (Der Grüne Punkt) signals the manufacturer funds a national recycling collection system, NOT that the item itself is necessarily recyclable.' },

  { id:51, cat:'general', q:'What is "open-loop recycling"?',
    opts:['Recycling that takes place outdoors','Recycling where material is converted into a different product type than the original','A recycling system with no sorting required','Recycling exports to other countries'],
    ans:1, exp:'Open-loop recycling converts material into a different product (e.g. plastic bottles → polyester fleece). Closed-loop recycles into the same product type.' },

  { id:52, cat:'general', q:'What is "extended producer responsibility" (EPR)?',
    opts:['A law requiring consumers to sort all recyclables','A policy making manufacturers responsible for end-of-life disposal of their products','A program that extends the shelf life of products','A tax on businesses producing more than 1,000 tons of goods per year'],
    ans:1, exp:'EPR shifts the cost and responsibility of waste management to manufacturers, incentivizing them to design more recyclable and durable products from the start.' },

  { id:53, cat:'general', q:'What is a "zero-waste" lifestyle?',
    opts:['Producing absolutely no waste, ever','Aiming to divert all waste from landfills through reduction, reuse, recycling, and composting','Using only recycled products','Living without any packaging of any kind'],
    ans:1, exp:'Zero-waste is a philosophy and goal, not an absolute standard. The aim is to send nothing to landfill or incineration through careful material use cycles.' },

  { id:54, cat:'general', q:'What is "wishcycling"?',
    opts:['Recycling holiday wrapping paper','Tossing uncertain items in the recycling bin hoping they will be accepted, even if unsure','A recycling program that operates via donated wish-lists','Sorting recyclables by hand at home'],
    ans:1, exp:'Wishcycling contaminates entire loads. If you\'re not sure an item is accepted, check your local guidelines rather than guessing. When in doubt, throw it out.' },

  { id:55, cat:'general', q:'What percentage of all plastic produced globally has ever been recycled?',
    opts:['About 50%','About 30%','About 9%','About 65%'],
    ans:2, exp:'Only about 9% of all plastic ever produced has been recycled. The vast majority has gone to landfill, incineration, or leaked into the environment.' },

  { id:56, cat:'general', q:'Which item is NOT recyclable in most standard curbside programs?',
    opts:['Aluminum soda can','Glass wine bottle','Plastic straw','Cardboard cereal box'],
    ans:2, exp:'Plastic straws are too small and lightweight for sorting machinery and fall through conveyor screens. Switch to paper, metal, or silicone alternatives.' },

  { id:57, cat:'general', q:'Which of the "3 Rs" should come first?',
    opts:['Recycle','Reuse','Reduce','All three are equal'],
    ans:2, exp:'Reducing consumption is the most powerful action. Reuse comes second. Recycling is a last resort; it still requires energy, water, and transportation.' },

  { id:58, cat:'general', q:'What is the main benefit of composting food scraps instead of landfilling them?',
    opts:['Composting produces more energy','Composting produces CO₂ instead of methane, which is far less potent as a greenhouse gas','Composting takes up less space','Composting happens faster'],
    ans:1, exp:'Landfill decomposition is anaerobic (no oxygen), producing methane, which is roughly 80x more potent than CO2 over 20 years. Aerobic composting produces CO2 and returns carbon to soil.' },

  /* Plastics — extra pool */
  { id:59, cat:'plastics', q:'What does PET stand for?',
    opts:['Plastic Environmental Technology','Polyethylene Terephthalate','Petroleum-Extracted Thermoplastic','Polyester Ethylene Tube'],
    ans:1, exp:'PET (Polyethylene Terephthalate) is resin code #1, used for water bottles, soda bottles, and food containers. It is widely accepted curbside.' },

  { id:60, cat:'plastics', q:'Compostable plastics labeled "PLA": can they go in curbside recycling bins?',
    opts:['Yes, they recycle just like regular plastic','No, they contaminate plastic recycling and need industrial composting','Yes, but only if marked with a recycling symbol','Yes, bioplastics always go in the green bin'],
    ans:1, exp:'Compostable PLA plastics contaminate regular plastic recycling streams. They only break down in industrial composting facilities at sustained high temperatures.' },

  { id:61, cat:'plastics', q:'What is bubble wrap made from?',
    opts:['#1 PET','#2 HDPE','#4 LDPE','#5 PP'],
    ans:2, exp:'Bubble wrap is #4 LDPE film. Like all soft film plastics, it cannot go in curbside recycling bins. Drop it off at grocery or retail store film collection points.' },

  { id:62, cat:'plastics', q:'What are microplastics?',
    opts:['A brand of biodegradable plastic','Plastic fragments smaller than 5mm formed by the breakdown of larger plastics','A type of plastic used only in medical devices','Very thin plastic film used in food packaging'],
    ans:1, exp:'Microplastics (< 5 mm) are now found in oceans, drinking water, soil, human blood, and unborn babies. They originate from fragmented larger plastic items.' },

  { id:63, cat:'plastics', q:'Why is black plastic packaging almost never recycled?',
    opts:['It is made from a different chemical formula','Infrared sorting machines at recycling facilities cannot detect the carbon-black pigment','It is too heavy for conveyor belts','It costs more to process than other colors'],
    ans:1, exp:'Optical sorting at MRFs uses near-infrared (NIR) light that is blind to carbon-black pigmented plastics, so they are sorted out as contamination.' },

  { id:64, cat:'plastics', q:'Why is recycling plastics more complex than recycling metals like aluminum?',
    opts:['Plastics are heavier and harder to transport','Different plastics have incompatible chemistry and melting points, so they cannot be mixed during processing','Plastics must be recycled in specialized overseas factories','Plastic recycling always releases toxic gases'],
    ans:1, exp:'Aluminum is one consistent material. Plastics are a family of different polymers with different chemistries that produce weak, useless material when mixed.' },

  { id:65, cat:'plastics', q:'What is "chemical recycling" of plastics?',
    opts:['Using chemicals to clean plastics before mechanical recycling','Breaking plastics back into their chemical building blocks or fuel using heat or catalysts','Recycling plastic in a chemical plant environment','A natural process where bacteria digest plastic'],
    ans:1, exp:'Chemical recycling (pyrolysis, gasification, depolymerization) breaks plastic down to monomers or fuel. It can handle mixed or contaminated plastics but is energy-intensive.' },

  { id:66, cat:'plastics', q:'#5 Polypropylene (PP) is most commonly found in which everyday item?',
    opts:['Water bottles','Yogurt containers and bottle caps','Cling wrap','Styrofoam cups'],
    ans:1, exp:'PP (#5) is used for yogurt tubs, bottle caps, straws, and medicine bottles. Its acceptance in curbside programs has been growing steadily.' },

  { id:67, cat:'plastics', q:'What fraction of plastic packaging is used just once before disposal?',
    opts:['About one-quarter','About one-third','About half','About two-thirds'],
    ans:2, exp:'Roughly half of all plastic produced is designed for single-use applications (packaging, straws, cups, and bags), most of which ends up in landfill or the environment.' },

  { id:68, cat:'plastics', q:'When a plastic bottle says "#1 PET - Please Recycle," what does that guarantee?',
    opts:['It will definitely be recycled in your municipality','It is a widely recyclable plastic type, but local acceptance still varies','It meets environmental safety standards','It will biodegrade within 10 years'],
    ans:1, exp:'The resin code only identifies the plastic polymer. Whether it is accepted by your local recycling program depends on local markets and facility capabilities.' },

  { id:69, cat:'plastics', q:'What is the most effective individual action to reduce plastic waste?',
    opts:['Recycling more items','Switching to reusable bags, bottles, and containers','Buying biodegradable plastic alternatives','Donating plastic items to charity'],
    ans:1, exp:'Switching to durable reusables eliminates plastic waste at the source. Recycling is still necessary but consumes energy and typically results in downcycling.' },

  { id:70, cat:'plastics', q:'Which of these is a serious concern about "biodegradable" plastic bags?',
    opts:['They are more expensive to produce','They still require specific industrial conditions to break down and can persist for years in normal environments','They cannot hold as much weight','They contaminate aluminum recycling'],
    ans:1, exp:'"Biodegradable" plastics often need heat, light, and oxygen levels only found in industrial facilities. In landfill or water, they can persist for years, behaving like conventional plastic.' },

  /* Paper — extra pool */
  { id:71, cat:'paper', q:'Can paper with ink printed on it still be recycled?',
    opts:['No, ink permanently ruins the paper fibers','Yes, modern de-inking processes remove most inks during pulping','Only if the ink is vegetable-based','Only black-and-white printed paper can be recycled'],
    ans:1, exp:'Most printed paper is recyclable. De-inking during paper recycling uses water, chemicals, and flotation to remove ink. Glossy inks may cause minor quality loss.' },

  { id:72, cat:'paper', q:'How many times can a paper fiber typically be recycled before it becomes too short to use?',
    opts:['1–2 times','5–7 times','10–15 times','Indefinitely'],
    ans:1, exp:'Paper fibers shorten with each recycling cycle. After about 5–7 cycles, fibers are too short to bond into paper. Virgin fiber is blended in to maintain strength.' },

  { id:73, cat:'paper', q:'What does "FSC certified" mean on a paper product?',
    opts:['The paper is 100% recycled content','The wood came from responsibly managed forests certified by the Forest Stewardship Council','The paper is free of bleaching chemicals','The product has a guaranteed paper take-back program'],
    ans:1, exp:'FSC (Forest Stewardship Council) certification means wood fiber was sourced from forests managed to strict environmental and social standards.' },

  { id:74, cat:'paper', q:'Why are paper receipts (thermal paper) generally not recyclable?',
    opts:['They are always too greasy','Thermal paper is coated with BPA or BPS chemicals that contaminate the recycling stream','They are too small for sorting machines','They are made of a non-paper material'],
    ans:1, exp:'Thermal paper receipts use BPA or BPS in their heat-sensitive coating. These chemicals contaminate paper recycling batches and should go in the trash.' },

  { id:75, cat:'paper', q:'Should you remove plastic windows from envelopes before recycling?',
    opts:['No, leave them in; facilities handle it','Yes, remove the plastic film as it contaminates paper recycling','Shred the entire envelope instead','Tear off the entire address area'],
    ans:1, exp:'Plastic windows on envelopes do not break down in the paper pulping process and contaminate the slurry. Many programs ask you to tear them out before recycling.' },

  { id:76, cat:'paper', q:'Which of these is NOT recyclable in standard paper recycling?',
    opts:['Brown paper bag','Glossy magazine','Wax-coated cardboard','Cardboard cereal box'],
    ans:2, exp:'Wax-coated cardboard (produce boxes, frozen food cartons) cannot be recycled because the wax cannot be separated from the paper fibers during pulping.' },

  { id:77, cat:'paper', q:'What happens to paper fibers during the recycling pulping stage?',
    opts:['They are sorted by color','They are shredded and compressed into new paper instantly','They are broken apart in water to form a wet slurry for cleaning and reforming','They are burned to generate energy for the facility'],
    ans:2, exp:'Pulping uses water and mechanical action to break paper into a wet fiber slurry. The slurry is then cleaned, de-inked, and reformed into new paper products.' },

  { id:78, cat:'paper', q:'Why are paper plates usually not recyclable?',
    opts:['They are made with wax','They are too large for sorting machinery','They absorb food grease that bonds to paper fibers and ruins recycled batches','They have a plastic coating'],
    ans:2, exp:'Used paper plates are almost always contaminated with food grease. Grease bonds with paper fibers and cannot be separated during recycling, ruining the whole batch.' },

  { id:79, cat:'paper', q:'Corrugated cardboard (the fluted wave-layer type) is especially valuable in recycling because:',
    opts:['It has very long, strong fibers ideal for making new packaging','It is always clean and uncontaminated','It is the most common item recycled','It does not require de-inking'],
    ans:0, exp:'Corrugated cardboard has long, strong fibers prized for making new kraft paper, shipping boxes, and packaging, and it is recycled at one of the highest rates of any material.' },

  { id:80, cat:'paper', q:'Can you recycle paper that got wet and then dried out?',
    opts:['Yes, it recycles perfectly','No, water damages the fiber structure and reduces quality or usability','Only if dried within 24 hours','Yes, but only if it has not turned moldy'],
    ans:1, exp:'Water breaks down paper fibers. Soaked and dried paper has weaker, shorter fibers that reduce recycled pulp quality. Always keep recyclables dry.' },

  { id:81, cat:'paper', q:'What does "virgin fiber" mean in paper production?',
    opts:['Paper from sustainably harvested forests','Paper made from freshly cut trees, not recycled content','Paper that has never been printed on','Unbleached, natural-color paper'],
    ans:1, exp:'Virgin fiber comes from freshly harvested wood pulp. Recycled paper uses recovered fiber instead, saving trees, energy, and water.' },

  { id:82, cat:'paper', q:'Which of these paper products IS widely recyclable in curbside programs?',
    opts:['Paper coffee cup','Wax paper','Toilet paper roll (cardboard tube)','Thermal receipt'],
    ans:2, exp:'Cardboard toilet paper and paper towel rolls are among the most easily recycled items; clean cardboard with no problematic coatings.' },

  /* Food & Composting — extra pool */
  { id:83, cat:'food', q:'What is the primary greenhouse gas produced when food waste decomposes in a landfill?',
    opts:['Carbon dioxide (CO₂)','Methane (CH₄)','Nitrous oxide (N₂O)','Hydrogen sulfide (H₂S)'],
    ans:1, exp:'Food decomposing without oxygen in landfills produces methane, a greenhouse gas roughly 80x more potent than CO2 over 20 years.' },

  { id:84, cat:'food', q:'What are "greens" and "browns" in a compost pile?',
    opts:['Green = plant-based food scraps only, brown = animal-derived materials like manure','Green = nitrogen-rich fresh materials, brown = carbon-rich dry materials','Green = anything wet or recently harvested, brown = any dry household waste','Green = items destined for composting, brown = items that should be recycled instead'],
    ans:1, exp:'A healthy compost pile balances greens (food scraps, fresh grass = nitrogen) with browns (dried leaves, cardboard, straw = carbon) at roughly 1:2 by volume.' },

  { id:85, cat:'food', q:'What does "industrial composting" mean compared to backyard composting?',
    opts:['Industrial composting uses large sealed plastic bags to control moisture levels and speed up decomposition','Industrial composting uses sustained high heat (140–160°F) to break down meat, dairy, and certified compostable plastics','Industrial composting takes place inside standard recycling facilities, processed alongside paper and cardboard','They are essentially the same process, just running at a larger scale with more volume of material'],
    ans:1, exp:'Industrial composting reaches temperatures that kill pathogens and break down compostable plastics and food packaging, conditions impossible to achieve in a home bin.' },

  { id:86, cat:'food', q:'What fraction of all food produced globally is wasted or lost?',
    opts:['About 5%','About 15%','About one-third','About half'],
    ans:2, exp:'About one-third of all food produced globally (1.3 billion tonnes per year) is lost or wasted. If it were a country, food waste would be the third-largest emitter of greenhouse gases.' },

  { id:87, cat:'food', q:'What is a bokashi system?',
    opts:['A Japanese word for composting leaves and yard waste in an open outdoor pile','A fermentation system that can process all food waste including meat and dairy','A type of outdoor garden bin that uses sealed lids to keep rodents and pests out','A machine that liquefies food waste and pumps it into soil as a liquid fertilizer'],
    ans:1, exp:'Bokashi uses beneficial microbes to ferment all food scraps (including meat, dairy, and cooked food) in an airtight container. The fermented matter then goes in compost or soil.' },

  { id:88, cat:'food', q:'What is anaerobic digestion of food waste?',
    opts:['Composting organic matter without any added water, relying on dry heat to speed up breakdown','Breaking down organic matter without oxygen, producing biogas and a soil amendment','Burning food waste at extremely high temperatures to generate electricity from the steam','Freezing food waste at sub-zero temperatures to halt decomposition for later processing'],
    ans:1, exp:'Anaerobic digestion breaks organic matter down without oxygen, producing biogas (used for energy) and digestate (used as fertilizer) in a carbon-neutral process.' },

  { id:89, cat:'food', q:'Why should meat and dairy be avoided in a standard backyard compost bin?',
    opts:['They break down too quickly, overheating the pile and killing the beneficial composting bacteria','They attract pests and create odors; use a city compost cart or bokashi system instead','They make the compost excessively acidic, lowering pH to levels that damage plant roots','They are explicitly banned by local ordinances and composting regulations in most municipalities'],
    ans:1, exp:'Meat and dairy attract rodents, flies, and other pests, and create strong odors in backyard bins. Industrial composting or bokashi systems handle them safely.' },

  { id:90, cat:'food', q:'What is "food rescue" or "food recovery"?',
    opts:['A government-run program that tests food safety and freshness standards before products reach store shelves','Collecting surplus food from restaurants, farms, and stores to donate before it becomes waste','A specialized composting technique for processing expired or spoiled food in sealed containers','A process of extracting and concentrating nutrients from food waste into liquid fertilizer'],
    ans:1, exp:'Food rescue redirects surplus edible food to people in need, sitting at the very top of the waste hierarchy. The best outcome for food is always for it to be eaten.' },

  { id:91, cat:'food', q:'What does "compost maturity" mean?',
    opts:['Compost with a very strong ammonia smell, indicating high nitrogen activity that is still ongoing','Fully broken-down compost that is safe to add to soil without harming plant roots','Compost that has been stored and aged for a minimum of two years before use','Compost produced using the oldest traditional techniques, such as pit composting or open heaps'],
    ans:1, exp:'Mature compost looks like dark crumbly soil, has an earthy smell, and will not burn plant roots with excess nitrogen. Immature compost can harm seedlings.' },

  { id:92, cat:'food', q:'Can you compost citrus peels and onions in a worm bin?',
    opts:['Yes, worms thrive on them and their natural oils even help keep the worm bin free of pests','Avoid them; worms dislike the acidity and natural compounds, so use sparingly','Yes, but only if finely chopped and well mixed with plenty of neutral bedding material','No, all fruits and vegetables are too acidic and will rapidly harm or kill the worms'],
    ans:1, exp:'Citrus peels and onions contain compounds that irritate worms and can make a worm bin too acidic. Use them very sparingly or stick to milder food scraps.' },

  { id:93, cat:'food', q:'What should be your first priority when dealing with excess food?',
    opts:['Send excess food to a commercial composting facility so it can be properly processed','Compost it at home in a backyard bin to recover its nutrients for your garden','Reduce food waste by buying only what you need and planning meals','Feed it to household pets or local farm animals to avoid wasting the nutrients'],
    ans:2, exp:'The waste hierarchy puts prevention first. Reducing food waste at the source (meal planning, proper storage) beats even the best composting or energy recovery.' },

  { id:94, cat:'food', q:'Why does adding too many kitchen scraps too quickly kill a compost pile?',
    opts:['The scraps instantly consume all available oxygen, suffocating the microbes and halting all activity','The pile becomes too heavy and compacts under its own weight, preventing airflow from reaching the center','The nitrogen-rich scraps overwhelm beneficial bacteria and create a slimy, anaerobic, smelly mess','Kitchen scraps are inherently incompatible with outdoor composting and must always be processed indoors'],
    ans:2, exp:'A compost pile needs a carbon-to-nitrogen balance. Overloading with wet nitrogen-rich scraps without enough browns causes anaerobic conditions, which are smelly and ineffective.' },

  { id:95, cat:'food', q:'What percentage of municipal solid waste in the US is made up of food scraps?',
    opts:['About 5%','About 14%','About 22%','About 35%'],
    ans:2, exp:'Food waste makes up about 22% of municipal solid waste sent to landfills in the US, more than any other single material, making composting programs critically important.' },

  /* Myth Busters */
  { id:108, cat:'myths', q:'MYTH: All plastic with a recycling symbol on it can be recycled curbside.',
    opts:['True — the symbol is a universal guarantee that every local recycling program must accept that plastic type','False — the number identifies the resin type, not whether your local program accepts it','True — all plastics numbered 1 through 7 are accepted at every curbside recycling program nationwide','False — only plastics marked with a green recycling symbol on a white background can be recycled'],
    ans:1, exp:'The resin ID code (1–7) only tells you what type of plastic it is. Whether your local program accepts it depends entirely on local markets and facility capabilities.' },

  { id:109, cat:'myths', q:'MYTH: Rinsing recyclables before putting them in the bin is a waste of water.',
    opts:['True — rinsing uses far more water than recycling saves, making it a net negative for the environment','False — a quick rinse prevents contamination that ruins entire loads and saves more resources overall','True — all recycling facilities have industrial washing systems that fully clean every item on arrival','False — you should run every recyclable through a full dishwasher cycle to remove all food residue'],
    ans:1, exp:'A quick rinse (not a deep scrub) prevents grease and food residue from contaminating other recyclables. One greasy pizza box can ruin an entire bale of paper recycling.' },

  { id:110, cat:'myths', q:'MYTH: Glass recycling is not worth it because it\'s too heavy and expensive to transport.',
    opts:['True — the majority of collected glass in the US is simply sent to landfill because transport costs exceed any benefit','False — recycling glass saves significant energy and raw materials compared to making it from scratch','True — glass is always better off being reused as-is, since remelting wastes more energy than it conserves','False — glass is the single cheapest and most energy-efficient material to recycle in any program'],
    ans:1, exp:'While transport costs are real, recycling glass still saves around 30% of the energy needed to make it from raw silica sand, limestone, and soda ash.' },

  { id:111, cat:'myths', q:'MYTH: Biodegradable plastic bags are better for the environment than regular plastic bags.',
    opts:['True — they are specifically designed to break down safely and harmlessly in any environment, including oceans','False — most biodegradable plastics require specific industrial conditions and can persist for years in landfills or oceans','True — they naturally decompose within a few months in any landfill, leaving absolutely no harmful residue','False — biodegradable plastics are chemically and physically identical to conventional plastic bags in every way'],
    ans:1, exp:'"Biodegradable" plastics typically need sustained heat (above 140°F) found only in industrial composting facilities. In a landfill or ocean, they persist just like conventional plastic.' },

  { id:112, cat:'myths', q:'MYTH: It\'s fine to put your recyclables in a plastic bag before putting them in the recycling bin.',
    opts:['True — bagging recyclables keeps them clean and organized, making it easier for facility workers to sort them','False — plastic bags jam sorting machinery and cause millions in damage at recycling facilities annually','True — bagging items speeds up sorting because workers can identify and grab a whole group at once','False — this is only a problem for bags that are not clearly labeled "recyclable" or "compostable"'],
    ans:1, exp:'Loose plastic bags wrap around conveyor belts and rollers at sorting facilities, causing equipment jams that halt operations. Always put recyclables loose in the bin.' },

  { id:113, cat:'myths', q:'MYTH: Recycling paper wastes more energy than just making new paper.',
    opts:['True — the chemical de-inking process alone consumes more energy than simply harvesting and pulping fresh wood','False — recycling paper uses 40–64% less energy than making it from virgin wood pulp','True — it only saves energy when the recycling facility happens to be located very close to where paper is collected','False — recycled paper actually saves closer to 90% of the energy, far more than the commonly cited figure'],
    ans:1, exp:'Recycling paper uses approximately 40–64% less energy than virgin paper production. It also saves 7,000 gallons of water per ton and reduces greenhouse gas emissions significantly.' },

  { id:114, cat:'myths', q:'MYTH: Recycling has no real impact. Companies just ship it overseas anyway.',
    opts:['True — the majority of US recyclables are shipped to developing countries where they end up landfilled without processing','False — while export markets exist, many materials are recycled domestically and global recycling still reduces raw material extraction','True — it is all corporate greenwashing; recycling programs exist only to make consumers feel better about their waste','False — nothing in the US recycling system is ever exported; all collected materials are fully processed domestically'],
    ans:1, exp:'While exports are real (especially after China\'s 2018 National Sword policy changed trade), domestic recycling industries have grown significantly. Even imperfect recycling reduces mining, deforestation, and emissions.' },

  { id:115, cat:'myths', q:'MYTH: Pizza boxes are always recyclable as long as you remove the food.',
    opts:['True — cardboard is always cardboard regardless of grease, and recycling facilities are fully equipped to handle it','False — grease soaks into the cardboard fibers and cannot be removed during pulping, making grease-soaked portions non-recyclable','True — you just need to scrape off any cheese and the grease wipes clean enough for recycling','False — pizza boxes are completely non-recyclable under any circumstances and must always go in the trash'],
    ans:1, exp:'Grease bonds chemically with paper fibers and cannot be separated during the water-based pulping process. Best practice: tear off and recycle the clean lid; trash the greasy base.' },

  { id:116, cat:'myths', q:'MYTH: Buying products made from recycled content doesn\'t make a real difference.',
    opts:['True — the final product is physically identical whether it uses virgin or recycled materials, so it makes no difference','False — buying recycled content creates market demand that makes recycling economically viable and funds collection programs','True — companies only label products as "recycled" for marketing purposes; the claims are rarely verified or accurate','False — purchasing recycled content only makes a difference when the product is made from 100% recycled materials'],
    ans:1, exp:'Recycling only works as a system when there are buyers for recycled materials. Purchasing recycled-content products "closes the loop" and makes the economics work for recycling programs.' },

  { id:117, cat:'myths', q:'MYTH: Composting is complicated and smelly. Is it practical at home?',
    opts:['True — home composting always produces strong unpleasant odors that nearby neighbors will inevitably complain about','False — a properly maintained compost bin with balanced greens and browns produces little odor and is straightforward to manage','True — only city-run or industrial composting programs have the proper equipment needed to avoid bad odors','False — home composting can work well, but only if you have a large yard with plenty of outdoor space available'],
    ans:1, exp:'Odor comes from imbalanced piles (too many food scraps, not enough carbon-rich browns). A properly balanced pile with a 2:1 brown-to-green ratio and occasional turning is nearly odor-free.' },

  { id:118, cat:'myths', q:'MYTH: Recycling aluminum is not important because bauxite ore is abundant.',
    opts:['True — aluminum ore reserves are so vast they will easily last thousands of years without any need for conservation','False — recycling aluminum uses 95% less energy than mining and smelting new aluminum, making it one of the most valuable recyclables','True — the energy difference between recycled and virgin aluminum production is minimal and not worth the collection effort','False — energy savings from recycling only apply to countries that import bauxite and do not have local deposits'],
    ans:1, exp:'Even though bauxite deposits exist, the smelting process is extraordinarily energy-intensive. Recycling uses 95% less energy; a recycled can can be back on shelves in just 60 days.' },

  { id:119, cat:'myths', q:'MYTH: Throwing one wrong item in a recycling bin doesn\'t affect the rest of the load.',
    opts:['True — one item is too small to matter in a full truckload','False — one bad item can cause an entire truckload to be rejected','True — facility workers remove problem items before processing','False — but only liquid-filled containers cause real problems'],
    ans:1, exp:'Contamination rates above 10–15% often cause facilities to reject entire loads. One greasy food container, a bag of paint, or a full liquid bottle can contaminate hundreds of pounds of otherwise recyclable material.' },

  /* ---- NEW General questions ---- */
  { id:120, cat:'general', q:'Which US state has the highest bottle deposit refund per container?',
    opts:['California','Oregon','New York','Michigan'],
    ans:3, exp:'Michigan has a 10-cent deposit per container (the highest in the US), which is why it consistently achieves over 90% return rates for bottles and cans.' },

  { id:121, cat:'general', q:'What is a "Materials Recovery Facility" primarily designed to do?',
    opts:['Burn waste to generate electricity','Sort mixed recyclables into separate material streams for sale','Store hazardous materials safely underground','Compost food waste at large scale'],
    ans:1, exp:'MRFs use a combination of conveyor belts, optical sorters, magnets, and air jets to separate mixed recyclables into clean streams of paper, plastic, glass, and metal.' },

  { id:122, cat:'general', q:'Approximately how much energy is saved by recycling one aluminum can compared to making a new one?',
    opts:['About 10%','About 40%','About 75%','About 95%'],
    ans:3, exp:'Recycling one aluminum can saves enough energy to power a TV for 3 hours. The process uses 95% less energy than smelting new aluminum from bauxite ore.' },

  { id:123, cat:'general', q:'What does "life cycle assessment" (LCA) measure?',
    opts:['How long a product lasts before breaking','The total environmental impact of a product from raw material to disposal','A company\'s annual recycling tonnage','The cost of recycling programs per household'],
    ans:1, exp:'An LCA tracks all environmental impacts (energy use, emissions, water use, waste) across a product\'s entire life from raw material extraction through manufacturing, use, and end of life.' },

  { id:124, cat:'general', q:'Which of these is the correct hierarchy for managing waste, from most to least preferred?',
    opts:['Recycle → Reduce → Reuse → Dispose','Reduce → Reuse → Recycle → Recover → Dispose','Dispose → Recycle → Reuse → Reduce','Reuse → Reduce → Recycle → Dispose'],
    ans:1, exp:'The waste hierarchy puts prevention (Reduce) first, then Reuse, Recycle, energy Recovery, and Disposal last. Each step down the hierarchy has greater environmental impact.' },

  { id:125, cat:'general', q:'What does the term "landfill diversion rate" measure?',
    opts:['How far a truck travels to reach the landfill','The share of waste that is recycled, composted, or recovered instead of landfilled','The depth of a landfill in meters','How quickly a landfill fills to capacity'],
    ans:1, exp:'Diversion rate is the percentage of total waste that is kept out of landfill through recycling, composting, and other recovery methods. Higher is better.' },

  { id:126, cat:'general', q:'What color are most "general recycling" bins in the United States?',
    opts:['Red','Yellow','Blue','Green'],
    ans:2, exp:'Blue is the most widely used color for curbside recycling bins in the US, though colors can vary by municipality. Green often indicates compost bins.' },

  /* ---- NEW Plastics questions ---- */
  { id:127, cat:'plastics', q:'What does "ocean-bound plastic" mean on a product label?',
    opts:['Plastic collected directly from the ocean floor','Plastic waste collected from coastal communities before it reaches the ocean','A type of water-resistant plastic coating','Plastic designed to float and be collected from ocean gyres'],
    ans:1, exp:'"Ocean-bound plastic" is collected from coastal areas, rivers, and communities within ~50km of the ocean, intercepting it before it enters the sea. It is not literally collected from the ocean.' },

  { id:128, cat:'plastics', q:'What is the main problem with oxo-degradable plastics?',
    opts:['They cost more to produce than regular plastics','They fragment into microplastics but don\'t actually biodegrade','They cannot be formed into thin films or bags','They release sulfur compounds when heated'],
    ans:1, exp:'Oxo-degradable plastics just break into smaller and smaller pieces (microplastics) rather than truly biodegrading. They are banned in the EU for this reason.' },

  { id:129, cat:'plastics', q:'Which plastic has the highest recycling rate in the United States?',
    opts:['#5 PP (polypropylene)','#2 HDPE (natural color)','#1 PET bottles','#4 LDPE film'],
    ans:2, exp:'#1 PET beverage bottles lead at around 29% — still low, but the highest of any plastic. PET\'s value and clear market demand makes it the most consistently recycled.' },

  { id:130, cat:'plastics', q:'What happens to plastic when it is recycled into a lower-quality product?',
    opts:['It is called upcycling','It is called downcycling','It is called open-loop recycling','It is called chemical recycling'],
    ans:1, exp:'Downcycling produces something of lower quality; PET bottles become polyester fleece which cannot be recycled again. Unlike metals, most plastic can only be recycled a few times.' },

  { id:131, cat:'plastics', q:'Which resin code covers "Other" plastics, a category that is almost never recyclable curbside?',
    opts:['#4','#5','#6','#7'],
    ans:3, exp:'#7 is a catch-all for plastics that don\'t fit codes 1–6, including polycarbonate, PLA, and layered films. These are rarely accepted by curbside programs.' },

  /* ---- NEW Paper questions ---- */
  { id:132, cat:'paper', q:'Which type of paper has the longest fibers and is most prized for recycling?',
    opts:['Newspaper','Office printer paper','Corrugated cardboard','Tissue paper'],
    ans:2, exp:'Corrugated cardboard (kraft paper) has long, strong wood fibers that make it the most valuable paper for recycling into new packaging materials.' },

  { id:133, cat:'paper', q:'What is "de-inking" in the paper recycling process?',
    opts:['Removing metallic staples and clips from paper','Stripping ink from paper fibers using water, chemicals, and flotation','Bleaching paper to make it white again','Sorting paper by color in the recycling facility'],
    ans:1, exp:'De-inking uses a soapy water solution and air flotation. Ink particles are attracted to air bubbles and float away from the paper fiber slurry, leaving cleaner pulp.' },

  { id:134, cat:'paper', q:'Can you recycle a paper bag that has been used to hold produce?',
    opts:['No — any contact with food makes paper unrecyclable','Yes — paper bags with light food residue are generally still recyclable after being emptied','Only if you wash and dry it first','Only brown kraft bags, not white ones'],
    ans:1, exp:'Light food residue on paper bags is acceptable; the pulping process handles minor contamination. Empty it out and it\'s fine for most curbside programs.' },

  { id:135, cat:'paper', q:'Why do paper fibers get shorter with each recycling cycle?',
    opts:['Recycling machines physically cut them','Chemical de-inking agents dissolve the fiber bonds','Mechanical agitation during pulping breaks and shortens existing fibers','Heat during drying causes fibers to shrink permanently'],
    ans:2, exp:'The mechanical action of pulping (mixing, beating) physically breaks paper fibers, shortening them each cycle. After 5–7 cycles they\'re too short to bond into new paper.' },

  /* ---- NEW Food questions ---- */
  { id:136, cat:'food', q:'What is the "food waste hierarchy," in order from most to least preferred?',
    opts:['Donate → Compost → Recycle → Landfill','Prevent → Feed people → Feed animals → Compost → Landfill','Compost → Donate → Reduce → Landfill','Recycle → Donate → Reduce → Compost'],
    ans:1, exp:'The EPA\'s Food Recovery Hierarchy: prevent waste first, then feed hungry people, then animals, then compost organics, and landfill only as a last resort.' },

  { id:137, cat:'food', q:'Which gas produced by food in landfills is collected and sometimes used to generate electricity?',
    opts:['Carbon dioxide','Hydrogen','Methane','Nitrogen'],
    ans:2, exp:'Landfill gas is mostly methane, produced by anaerobic decomposition. Many modern landfills capture it to generate electricity, reducing its climate impact.' },

  { id:138, cat:'food', q:'What is the carbon-to-nitrogen (C:N) ratio recommended for a healthy compost pile?',
    opts:['1:1 (equal parts)','25–30:1 (carbon-heavy)','5:1 (nitrogen-heavy)','100:1 (very carbon-rich)'],
    ans:1, exp:'A C:N ratio of 25–30:1 is ideal. Too much carbon (browns) slows decomposition; too much nitrogen (greens) creates smelly, anaerobic conditions.' },

  { id:139, cat:'food', q:'What do worms need most in a vermicomposting bin to stay healthy?',
    opts:['Direct sunlight and warm temperatures above 90°F','Moist, dark conditions with a balanced diet of food scraps and bedding','A very acidic environment with citrus peels','Meat and dairy for protein-rich nutrition'],
    ans:1, exp:'Red wigglers thrive at 55-77°F in moist, dark conditions. They need bedding (shredded paper, cardboard) and a balanced diet. Avoid citrus, onions, and meat.' },

  /* ---- NEW E-Waste questions ---- */
  { id:140, cat:'ewaste', q:'Which company operates the largest in-store electronics take-back program in the US?',
    opts:['Walmart','Target','Best Buy','Home Depot'],
    ans:2, exp:'Best Buy accepts TVs, computers, phones, cables, and more at most stores for certified recycling, regardless of where you bought the item.' },

  { id:141, cat:'ewaste', q:'What is "planned obsolescence" in electronics?',
    opts:['A recall when electronics fail safety tests','Designing products to become outdated or stop working to encourage new purchases','A law requiring manufacturers to upgrade products for free','Deliberately limiting the lifespan of batteries'],
    ans:1, exp:'Planned obsolescence drives e-waste by making devices intentionally short-lived through software lock-outs, non-replaceable batteries, or design choices that discourage repair.' },

  { id:142, cat:'ewaste', q:'What does "R2 certification" mean for an electronics recycler?',
    opts:['They recycle at least 2 tons of e-waste daily','They meet rigorous standards for responsible recycling and worker safety','They are registered in 2 or more states','They use a two-step manual and automated process'],
    ans:1, exp:'R2 (Responsible Recycling) certification requires audited environmental health, safety, and data-destruction standards. Look for R2 or e-Stewards when choosing a recycler.' },

  { id:143, cat:'ewaste', q:'Why are rare earth elements in electronics important to recover?',
    opts:['They are highly radioactive and must be contained safely','Mining them is extremely destructive and they are critical for renewable energy tech','They are so valuable that recovery pays for the full recycling process','They are needed to make new plastic components'],
    ans:1, exp:'Rare earths (neodymium, terbium, etc.) are essential for EV motors, wind turbines, and electronics. They are hard to mine and often sourced under harmful conditions, so recovery matters.' },

  /* ---- NEW Myth questions ---- */
  { id:144, cat:'myths', q:'MYTH: Glass is recycled back into new glass bottles.',
    opts:['True — all collected glass is always melted down and recycled into brand new glass bottles and jars','False — most collected glass is crushed for low-value uses like road fill, not new bottles','True — all glass in the US goes through a closed-loop system and is remelted into new containers','False — glass collected from recycling bins is chemically converted into plastic pellets, not new glass'],
    ans:1, exp:'Less than half of collected glass in the US ends up as new bottles. Much is "downcycled" into fiberglass insulation, sand for construction, or road aggregate.' },

  { id:145, cat:'myths', q:'MYTH: Recycling is always better for the environment than making new materials.',
    opts:['True — recycling universally and always uses significantly less energy and fewer resources than any virgin production','False — for some materials in some contexts, the transport and processing energy can rival virgin production','True — every single recycled item saves both energy and resources, with no exceptions under any conditions','False — recycling never saves energy over virgin production; it is always more energy-intensive to process used materials'],
    ans:1, exp:'Context matters. Transporting light materials long distances can offset savings. However, for metals and paper, recycling almost universally wins. The key is efficient local systems.' },

  { id:146, cat:'myths', q:'MYTH: Paper is the number-one material in US landfills.',
    opts:['True — paper makes up the majority of landfill volume even after decades of recycling programs','False — food waste is now the single largest material category in US landfills','True — even with widespread paper recycling, paper still dominates landfill content by weight','False — plastic packaging is by far the single largest material filling US landfills today'],
    ans:1, exp:'Food waste overtook paper as the largest landfill material in the US. About 22% of landfill content is food scraps, a key reason composting programs are expanding.' },

  { id:147, cat:'myths', q:'MYTH: Styrofoam is just another word for any foam plastic.',
    opts:['True — Styrofoam is an officially recognized generic term that applies to all types of foam plastic products','False — Styrofoam is a Dow Chemical trademark specifically for extruded polystyrene (XPS) insulation, not food containers','True — all white foam food containers, cups, and packing peanuts are technically and legally called Styrofoam','False — Styrofoam is a trademarked name that refers exclusively to biodegradable foam used in packaging'],
    ans:1, exp:'Styrofoam® is a Dow Chemical brand name for blue XPS foam used in building insulation. White foam food containers are expanded polystyrene (EPS), a different form of the same resin.' },

  /* E-Waste — extra pool */
  { id:96, cat:'ewaste', q:'What is an "e-Stewards" certification for electronics recyclers?',
    opts:['A government program for free e-waste pickup','The highest-standard certification ensuring responsible recycling without exporting hazardous waste to developing countries','A consumer guarantee that electronics are refurbished','A rating system for eco-friendly manufacturers'],
    ans:1, exp:'e-Stewards is the most rigorous certification for electronics recyclers, prohibiting export of hazardous waste and requiring strict environmental standards throughout.' },

  { id:97, cat:'ewaste', q:'Why is informal e-waste recycling in developing countries a serious health problem?',
    opts:['Workers recycle too slowly','Workers use acid baths and open burning of circuit boards to recover metals, releasing toxic chemicals','E-waste can only be processed in high-tech facilities','Informal recyclers never recover valuable materials'],
    ans:1, exp:'Informal e-waste workers in countries like Ghana and India use primitive methods that expose communities to lead, mercury, cadmium, and brominated flame retardants.' },

  { id:98, cat:'ewaste', q:'What does refurbishing an electronic device accomplish?',
    opts:['The same environmental benefit as recycling it','It extends the device\'s useful life, delaying the energy cost of manufacturing a replacement','It makes the device lighter and faster','It removes all stored personal data'],
    ans:1, exp:'Refurbishing repairs and restores devices for resale or donation, keeping them in use longer. This is better than recycling because it avoids the energy cost of making entirely new devices.' },

  { id:99, cat:'ewaste', q:'Which electronics typically contain mercury?',
    opts:['Smartphone screens','Fluorescent backlights (CCFL) in older LCD monitors and CFL bulbs','Modern LED displays','Laptop keyboards'],
    ans:1, exp:'Older LCD screens used cold cathode fluorescent lamps (CCFL) for backlighting, which contain mercury. CFL bulbs do too. These must be handled as hazardous e-waste.' },

  { id:100, cat:'ewaste', q:'Approximately how much e-waste is generated globally each year?',
    opts:['About 5 million tonnes','About 25 million tonnes','About 50 million tonnes','About 100 million tonnes'],
    ans:2, exp:'The UN reports approximately 50 million tonnes of e-waste generated annually, with only about 17–20% formally collected and properly recycled.' },

  { id:101, cat:'ewaste', q:'What is the best approach for a smartphone that still works but has been replaced?',
    opts:['Throw it away immediately','Keep it in a drawer indefinitely','Donate, sell, or give it to someone who can use it','Recycle it at an e-waste facility right away'],
    ans:2, exp:'A working device has the most value when it continues to be used. Donate it to a school or nonprofit, or sell it. Recycling is best reserved for non-functional devices.' },

  { id:102, cat:'ewaste', q:'What should you do before recycling or selling a smartphone?',
    opts:['Remove only the SIM card','Do nothing — the recycler handles data wiping','Factory reset it to erase personal data, and remove the SIM and SD cards','Smash the screen to make disassembly easier'],
    ans:2, exp:'Always factory reset your device to protect personal data. Remove your SIM and SD cards. Back up any data you want to keep beforehand.' },

  { id:103, cat:'ewaste', q:'What does "right to repair" legislation aim to achieve?',
    opts:['Give consumers the right to return electronics for a refund','Require manufacturers to make spare parts and repair tools available to consumers and independent shops','Give companies the right to repair public infrastructure','Allow consumers to modify electronics for resale'],
    ans:1, exp:'Right to Repair laws aim to extend product lifespans by making independent repair viable, reducing e-waste by countering planned obsolescence.' },

  { id:104, cat:'ewaste', q:'Why are CRT (cathode-ray tube) TVs particularly hazardous e-waste?',
    opts:['They contain radioactive materials','Each CRT contains 4–8 lbs of lead that leaches into groundwater when landfilled','They contain more plastic than modern screens','They are too heavy for recycling machinery to handle'],
    ans:1, exp:'CRT screens use several pounds of lead to block X-ray emissions. When landfilled, this lead leaches into groundwater, causing severe neurological and health damage.' },

  { id:105, cat:'ewaste', q:'What should you do with a swollen (puffed-up) lithium-ion battery?',
    opts:['Keep using it until it dies','Stop using it immediately, do not puncture it, and take it to a battery recycling facility','Carefully pop it to release the gas','Put it in the freezer to shrink it back'],
    ans:1, exp:'A swollen battery has undergone dangerous internal chemical reactions and is a serious fire/explosion risk. Never puncture or compress it. Take it to an e-waste facility immediately.' },

  { id:106, cat:'ewaste', q:'What valuable metals are commonly recovered from recycled smartphones?',
    opts:['Iron and copper only','Gold, silver, and palladium','Aluminum only','Steel and zinc'],
    ans:1, exp:'A ton of circuit boards contains up to 800× more gold than a ton of ore. Smartphones contain gold, silver, palladium, platinum, and rare earth elements worth recovering.' },

  { id:107, cat:'ewaste', q:'Which retailer chain is well known for accepting old electronics for recycling in its stores?',
    opts:['Walmart','Target','Best Buy','Costco'],
    ans:2, exp:'Best Buy operates one of the largest in-store electronics take-back programs in the US, accepting TVs, computers, phones, cables, and more for certified recycling.' },
];

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = [
  /* Quiz milestones */
  { id:'first_quiz',       name:'First Step',        desc:'Complete your very first quiz',                       icon:'🌱', req: q => q.quizzes >= 1,  hint: q => `${Math.min(q.quizzes,1)} / 1 quiz completed` },
  { id:'quizzes5',         name:'Knowledge Seeker',  desc:'Complete 5 quizzes',                                  icon:'📚', req: q => q.quizzes >= 5,  hint: q => `${Math.min(q.quizzes,5)} / 5 quizzes` },
  { id:'quizzes10',        name:'Dedicated Learner', desc:'Complete 10 quizzes',                                 icon:'🎓', req: q => q.quizzes >= 10, hint: q => `${Math.min(q.quizzes,10)} / 10 quizzes` },
  { id:'quizzes25',        name:'Quiz Veteran',      desc:'Complete 25 quizzes',                                 icon:'📜', req: q => q.quizzes >= 25, hint: q => `${Math.min(q.quizzes,25)} / 25 quizzes` },
  /* Score & streak */
  { id:'streak3',          name:'Heating Up',        desc:'Get a 3-answer streak in a single quiz',              icon:'🔥', req: q => q.bestStreak >= 3,  hint: q => `${Math.min(q.bestStreak,3)} / 3 streak` },
  { id:'streak5',          name:'On Fire',           desc:'Get a 5-answer streak in a single quiz',              icon:'🔥', req: q => q.bestStreak >= 5,  hint: q => `${Math.min(q.bestStreak,5)} / 5 streak` },
  { id:'streak10',         name:'Unstoppable',       desc:'Get a 10-answer streak across your quiz history',     icon:'⚡', req: q => q.bestStreak >= 10, hint: q => `${Math.min(q.bestStreak,10)} / 10 streak` },
  { id:'perfect',          name:'Perfect Score',     desc:'Answer all questions correctly in one quiz',          icon:'🏆', req: q => q.lastPerfect,       hint: () => 'Get 100% in a single quiz' },
  { id:'cat_perfect',      name:'Category Ace',      desc:'Get a perfect score in 3 different categories',      icon:'🎯', req: q => (q.catPerfects?.size||0) >= 3, hint: q => `${Math.min(q.catPerfects?.size||0,3)} / 3 category perfect scores` },
  /* Points milestones */
  { id:'pts500',           name:'500 Club',          desc:'Earn 500 total points',                               icon:'⭐', req: q => q.totalPoints >= 500,  hint: q => `${Math.min(q.totalPoints,500).toLocaleString()} / 500 pts` },
  { id:'pts1000',          name:'Point Millionaire', desc:'Earn 1,000 total points',                             icon:'💎', req: q => q.totalPoints >= 1000, hint: q => `${Math.min(q.totalPoints,1000).toLocaleString()} / 1,000 pts` },
  { id:'pts2000',          name:'Rising Star',       desc:'Earn 2,000 total points',                             icon:'🌟', req: q => q.totalPoints >= 2000, hint: q => `${Math.min(q.totalPoints,2000).toLocaleString()} / 2,000 pts` },
  { id:'pts5000',          name:'Eco Champion',      desc:'Reach 5,000 total points',                            icon:'🚀', req: q => q.totalPoints >= 5000, hint: q => `${Math.min(q.totalPoints,5000).toLocaleString()} / 5,000 pts` },
  /* Categories */
  { id:'all_cats',         name:'All-Rounder',       desc:'Complete every quiz category at least once',          icon:'🌍', req: q => q.catsPlayed && q.catsPlayed.size >= 5, hint: q => `${Math.min(q.catsPlayed?.size||0,5)} / 5 categories played` },
  /* Social */
  { id:'friend_added',     name:'Social Recycler',   desc:'Add your first friend',                               icon:'🤝', req: q => q.friendsAdded >= 1, hint: q => `${Math.min(q.friendsAdded,1)} / 1 friend added` },
  /* Scanner */
  { id:'first_scan',       name:'Sharp Eye',         desc:'Earn points from your first product scan',            icon:'🔍', req: q => (q.scanCount||0) >= 1,  hint: q => `${Math.min(q.scanCount||0,1)} / 1 scan` },
  { id:'scanner_5',        name:'Barcode Hunter',    desc:'Earn scan points 5 times',                            icon:'📱', req: q => (q.scanCount||0) >= 5,  hint: q => `${Math.min(q.scanCount||0,5)} / 5 scans` },
  { id:'scanner_25',       name:'Scanner Pro',       desc:'Earn scan points 25 times',                           icon:'🏅', req: q => (q.scanCount||0) >= 25, hint: q => `${Math.min(q.scanCount||0,25)} / 25 scans` },
  { id:'daily_reset_used', name:'Fresh Start',       desc:'Use a Daily Reset power-up in the Scanner',           icon:'🔄', req: () => false, hint: () => 'Use a Daily Reset power-up in the Scanner tab' },
  /* Shop & power-ups */
  { id:'first_purchase',   name:'First Haul',        desc:'Buy your first item from the Shop',                   icon:'🛍️', req: () => false, hint: () => 'Purchase any item from the Shop' },
  { id:'power_user',       name:'Power Player',      desc:'Use a power-up during a quiz',                        icon:'⚡', req: q => (q.powerupsUsed||0) >= 1, hint: q => `${Math.min(q.powerupsUsed||0,1)} / 1 power-up used` },
  /* Sorting mini-game */
  { id:'sorter_perfect',   name:'Master Sorter',     desc:'Get a perfect score in the Sorting Game',             icon:'🗑️', req: () => false, hint: () => 'Sort all 10 items correctly in the Sorting Game' },
  { id:'sorter_played',    name:'Bin Basics',        desc:'Play the Sorting Game for the first time',            icon:'♻️', req: () => false, hint: () => 'Play the Sorting Mini-Game once' },
  /* Myth busters */
  { id:'myth_buster',      name:'Myth Buster',       desc:'Complete the Myth Busters quiz',                      icon:'🔮', req: q => (q.catsPlayed instanceof Set ? q.catsPlayed.has('myths') : (q.catsPlayed||[]).includes('myths')), hint: () => 'Complete the Myth Busters quiz category' },
  /* Daily spin */
  { id:'lucky_spin',       name:'Lucky Spin',        desc:'Win 500+ pts in a single Daily Spin',                 icon:'🎰', req: () => false, hint: () => 'Win 500 or more pts in a single Daily Spin' },
];

/* ---------- Avatars ---------- */
// Indices 0-2: free. Everything else requires points or a shop purchase.
const AVATARS = [
  '🌱','🌿','♻️',                                       // free (0-2)
  '🌍','🌊','🦋','🌻','🍃','🌳','💚',                   // tier 1 (3-9)
  '🦝','🐸','🌵','🦉','🐬','🌈','⭐','🏆',             // tier 2 (10-17)
  '🦜','🐨','🦊','🦁','🐧','🌺','🍄','🌙',             // tier 3 (18-25)
];

// Every index beyond 2 requires points OR a shop purchase.
const AVATAR_UNLOCKS = {
  3:75,   4:150,  5:250,  6:400,  7:600,  8:850,  9:1100,
  10:1400, 11:1800, 12:2200, 13:2700, 14:3200, 15:3800, 16:4500, 17:5500,
  18:7000, 19:9000, 20:11000, 21:14000, 22:17000, 23:20000, 24:25000, 25:30000,
};

/* ---------- Power-ups ---------- */
const POWERUPS = [
  { id:'fifty_fifty',   icon:'⚡', name:'50/50',         desc:'Remove 2 wrong answers from the current question.'             },
  { id:'streak_freeze', icon:'🧊', name:'Streak Freeze',  desc:'Protect your streak from breaking once if you answer wrong.'   },
  { id:'point_booster', icon:'🚀', name:'Point Booster',  desc:'Double all points earned during the quiz session.'             },
  { id:'daily_reset',   icon:'🔄', name:'Daily Reset',    desc:'Reset your 5-scan daily cap to earn scan points again today.'  },
];

/* ---------- Shop ---------- */
const SHOP_PERMANENT = [
  { id:'sh_av3',          type:'avatar', idx:3,          name:'Earth 🌍',         cost:120  },
  { id:'sh_av4',          type:'avatar', idx:4,          name:'Ocean Wave 🌊',    cost:200  },
  { id:'sh_av5',          type:'avatar', idx:5,          name:'Butterfly 🦋',     cost:320  },
  { id:'sh_av6',          type:'avatar', idx:6,          name:'Sunflower 🌻',     cost:500  },
  { id:'sh_t_recycler',   type:'title',  titleId:'recycler',   name:'Recycler',    cost:150  },
  { id:'sh_t_greenthumb', type:'title',  titleId:'greenthumb', name:'Green Thumb', cost:450  },
  { id:'sh_pu_5050',      type:'powerup', puId:'fifty_fifty',   name:'50/50',         cost:200 },
  { id:'sh_pu_freeze',    type:'powerup', puId:'streak_freeze', name:'Streak Freeze', cost:175 },
  { id:'sh_pu_boost',     type:'powerup', puId:'point_booster', name:'Point Booster', cost:400 },
  { id:'sh_pu_reset',     type:'powerup', puId:'daily_reset',   name:'Daily Reset',   cost:125 },
  /* Profile Frames — always available */
  { id:'sh_frame_green',    type:'frame', frameId:'frame_green',    name:'Forest Frame 🌿',    cost:350  },
  { id:'sh_frame_blue',     type:'frame', frameId:'frame_blue',     name:'Ocean Frame 🌊',     cost:350  },
  { id:'sh_frame_silver',   type:'frame', frameId:'frame_silver',   name:'Silver Frame 🪙',    cost:500  },
  { id:'sh_frame_purple',   type:'frame', frameId:'frame_purple',   name:'Amethyst Frame 💜',  cost:600  },
  { id:'sh_frame_rose',     type:'frame', frameId:'frame_rose',     name:'Rose Frame 🌸',      cost:600  },
  { id:'sh_frame_mint',     type:'frame', frameId:'frame_mint',     name:'Mint Frame 🩵',      cost:650  },
  { id:'sh_frame_shadow',   type:'frame', frameId:'frame_shadow',   name:'Shadow Frame 🌑',    cost:700  },
  { id:'sh_frame_emerald',  type:'frame', frameId:'frame_emerald',  name:'Emerald Frame 💚',   cost:700  },
  { id:'sh_frame_ice',      type:'frame', frameId:'frame_ice',      name:'Frost Frame ❄️',     cost:750  },
  { id:'sh_frame_crimson',  type:'frame', frameId:'frame_crimson',  name:'Crimson Frame ❤️',   cost:800  },
  /* The 10 frames below are daily-shop-only (see SHOP_ROTATING) */
];

const SHOP_ROTATING = [
  /* Tier 1 avatars */
  { id:'sh_r_av7',         type:'avatar', idx:7,          name:'Leaf 🍃',           cost:700  },
  { id:'sh_r_av8',         type:'avatar', idx:8,          name:'Tree 🌳',           cost:950  },
  { id:'sh_r_av9',         type:'avatar', idx:9,          name:'Green Heart 💚',    cost:1200 },
  /* Tier 2 avatars */
  { id:'sh_r_av10',        type:'avatar', idx:10,         name:'Raccoon 🦝',        cost:1500 },
  { id:'sh_r_av11',        type:'avatar', idx:11,         name:'Frog 🐸',           cost:2000 },
  { id:'sh_r_av12',        type:'avatar', idx:12,         name:'Cactus 🌵',         cost:2400 },
  { id:'sh_r_av13',        type:'avatar', idx:13,         name:'Owl 🦉',            cost:2900 },
  { id:'sh_r_av14',        type:'avatar', idx:14,         name:'Dolphin 🐬',        cost:3400 },
  { id:'sh_r_av15',        type:'avatar', idx:15,         name:'Rainbow 🌈',        cost:4000 },
  { id:'sh_r_av16',        type:'avatar', idx:16,         name:'Star ⭐',           cost:4800 },
  { id:'sh_r_av17',        type:'avatar', idx:17,         name:'Trophy 🏆',         cost:5800 },
  /* Rotating frames */
  { id:'sh_r_fr_green',    type:'frame', frameId:'frame_green',    name:'Forest Frame 🌿',    cost:350  },
  { id:'sh_r_fr_blue',     type:'frame', frameId:'frame_blue',     name:'Ocean Frame 🌊',     cost:350  },
  { id:'sh_r_fr_silver',   type:'frame', frameId:'frame_silver',   name:'Silver Frame 🪙',    cost:500  },
  { id:'sh_r_fr_purple',   type:'frame', frameId:'frame_purple',   name:'Amethyst Frame 💜',  cost:600  },
  { id:'sh_r_fr_rose',     type:'frame', frameId:'frame_rose',     name:'Rose Frame 🌸',      cost:600  },
  { id:'sh_r_fr_mint',     type:'frame', frameId:'frame_mint',     name:'Mint Frame 🩵',      cost:650  },
  { id:'sh_r_fr_shadow',   type:'frame', frameId:'frame_shadow',   name:'Shadow Frame 🌑',    cost:700  },
  { id:'sh_r_fr_emerald',  type:'frame', frameId:'frame_emerald',  name:'Emerald Frame 💚',   cost:700  },
  { id:'sh_r_fr_ice',      type:'frame', frameId:'frame_ice',      name:'Frost Frame ❄️',     cost:750  },
  { id:'sh_r_fr_crimson',  type:'frame', frameId:'frame_crimson',  name:'Crimson Frame ❤️',   cost:800  },
  { id:'sh_r_fr_sunset',   type:'frame', frameId:'frame_sunset',   name:'Sunset Frame 🌅',    cost:900  },
  { id:'sh_r_fr_gold',     type:'frame', frameId:'frame_gold',     name:'Gold Frame ✨',       cost:900  },
  { id:'sh_r_fr_lava',     type:'frame', frameId:'frame_lava',     name:'Lava Frame 🌋',      cost:1000 },
  { id:'sh_r_fr_electric', type:'frame', frameId:'frame_electric', name:'Electric Frame ⚡',  cost:1000 },
  { id:'sh_r_fr_neon',     type:'frame', frameId:'frame_neon',     name:'Neon Frame 🟢',      cost:1000 },
  { id:'sh_r_fr_void',     type:'frame', frameId:'frame_void',     name:'Void Frame 🌌',      cost:1200 },
  { id:'sh_r_fr_rainbow',  type:'frame', frameId:'frame_rainbow',  name:'Rainbow Frame 🌈',   cost:1400 },
  { id:'sh_r_fr_fire',     type:'frame', frameId:'frame_fire',     name:'Fire Frame 🔥',      cost:1400 },
  { id:'sh_r_fr_galaxy',   type:'frame', frameId:'frame_galaxy',   name:'Galaxy Frame 🔮',    cost:1800 },
  { id:'sh_r_fr_cosmic',   type:'frame', frameId:'frame_cosmic',   name:'Cosmic Frame 🌠',    cost:1800 },
  /* Tier 3 avatars */
  { id:'sh_r_av18',        type:'avatar', idx:18,         name:'Parrot 🦜',         cost:7200 },
  { id:'sh_r_av19',        type:'avatar', idx:19,         name:'Koala 🐨',          cost:9200 },
  { id:'sh_r_av20',        type:'avatar', idx:20,         name:'Fox 🦊',            cost:11200 },
  { id:'sh_r_av21',        type:'avatar', idx:21,         name:'Lion 🦁',           cost:14200 },
  { id:'sh_r_av22',        type:'avatar', idx:22,         name:'Penguin 🐧',        cost:17200 },
  { id:'sh_r_av23',        type:'avatar', idx:23,         name:'Hibiscus 🌺',       cost:20500 },
  { id:'sh_r_av24',        type:'avatar', idx:24,         name:'Mushroom 🍄',       cost:25500 },
  { id:'sh_r_av25',        type:'avatar', idx:25,         name:'Moon 🌙',           cost:30500 },
  /* Titles */
  { id:'sh_r_t_trailblz',  type:'title',  titleId:'trailblazer', name:'Trail Blazer',    cost:250  },
  { id:'sh_r_t_advocate',  type:'title',  titleId:'advocate',    name:'Eco Advocate',    cost:550  },
  { id:'sh_r_t_warrior',   type:'title',  titleId:'warrior',     name:'Eco Warrior',     cost:800  },
  { id:'sh_r_t_champion',  type:'title',  titleId:'champion',    name:'Eco Champion',    cost:1100 },
  { id:'sh_r_t_guardian',  type:'title',  titleId:'guardian',    name:'Planet Guardian', cost:1600 },
  { id:'sh_r_t_master',    type:'title',  titleId:'master',      name:'Recycle Master',  cost:2100 },
  { id:'sh_r_t_legend',    type:'title',  titleId:'legend',      name:'Recycling Legend',cost:3100 },
  { id:'sh_r_t_sage',      type:'title',  titleId:'sage',        name:'Green Sage',      cost:4200 },
  { id:'sh_r_t_mythic',    type:'title',  titleId:'mythic',      name:'Recycling Mythic',cost:6200 },
];

/* ---------- Titles (unlocked by points) ---------- */
const TITLES = [
  { id:'newcomer',    label:'Newcomer',           pts:0     },
  { id:'recycler',    label:'Recycler',            pts:100   },
  { id:'trailblazer', label:'Trail Blazer',        pts:200   },
  { id:'greenthumb',  label:'Green Thumb',         pts:300   },
  { id:'advocate',    label:'Eco Advocate',        pts:500   },
  { id:'warrior',     label:'Eco Warrior',         pts:700   },
  { id:'champion',    label:'Eco Champion',        pts:1000  },
  { id:'guardian',    label:'Planet Guardian',     pts:1500  },
  { id:'master',      label:'Recycle Master',      pts:2000  },
  { id:'legend',      label:'Recycling Legend',    pts:3000  },
  { id:'sage',        label:'Green Sage',          pts:4000  },
  { id:'mythic',      label:'Recycling Mythic',    pts:6000  },
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
  'pvc':              { verdict:'check-local',    label:'PVC (#3 Plastic)',  tips:['Rarely accepted; check locally.'] },
  'ldpe':             { verdict:'check-local',    label:'LDPE (#4 Plastic)', tips:['Film plastics go to store drop-off.'] },
  'composite':        { verdict:'check-local',    label:'Composite Material',tips:['Mixed materials are hard to recycle; check locally.'] },
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

/* ============================================================
   SEEDED RNG UTILITIES
   Used for deterministic daily challenge / missions / friend challenges
   ============================================================ */
function seededRNG(seed) {
  let s = (Math.abs(seed) % 2147483647) || 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function dateSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h) || 1;
}

function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Returns { category, questions } for today's daily challenge */
function getDailyChallengeInfo(dateStr) {
  const rng = seededRNG(dateSeed(dateStr + '_dc'));
  const cats = ['general', 'plastics', 'paper', 'food', 'ewaste'];
  const cat  = cats[Math.floor(rng() * cats.length)];
  const pool = QUIZ_QUESTIONS.filter(q => q.cat === cat);
  return { category: cat, questions: shuffleSeeded(pool, seededRNG(dateSeed(dateStr + '_dcq'))).slice(0, 10) };
}

/* Returns 3 mission objects for today */
function getDailyMissions(dateStr) {
  const rng = seededRNG(dateSeed(dateStr + '_ms'));
  return shuffleSeeded(MISSION_POOL, rng).slice(0, 3);
}

/* Returns 10 seeded questions for a friend challenge (same for both players) */
function getChallengeQuestions(seed, category) {
  const pool = (category === 'mixed') ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter(q => q.cat === category);
  return shuffleSeeded(pool, seededRNG(seed)).slice(0, 10);
}

/* ============================================================
   DAILY MISSIONS POOL
   ============================================================ */
const MISSION_POOL = [
  { id:'m_quiz1',      label:'Complete a quiz',              icon:'🎯', type:'quiz_count',   target:1,         pts:15 },
  { id:'m_quiz3',      label:'Complete 3 quizzes',           icon:'📚', type:'quiz_count',   target:3,         pts:40 },
  { id:'m_streak5',    label:'Get a 5-answer streak',        icon:'🔥', type:'streak',       target:5,         pts:25 },
  { id:'m_streak8',    label:'Get an 8-answer streak',       icon:'⚡', type:'streak',       target:8,         pts:50 },
  { id:'m_perfect',    label:'Get a perfect quiz score',     icon:'🏆', type:'perfect',      target:1,         pts:60 },
  { id:'m_scan1',      label:'Scan a product barcode',       icon:'🔍', type:'scan_count',   target:1,         pts:10 },
  { id:'m_scan3',      label:'Scan 3 product barcodes',      icon:'📱', type:'scan_count',   target:3,         pts:30 },
  { id:'m_cat_gen',    label:'Play a General Recycling quiz',icon:'♻️', type:'play_category',target:'general', pts:20 },
  { id:'m_cat_plas',   label:'Play a Plastics quiz',         icon:'🧴', type:'play_category',target:'plastics',pts:20 },
  { id:'m_cat_paper',  label:'Play a Paper & Cardboard quiz',icon:'📰', type:'play_category',target:'paper',   pts:20 },
  { id:'m_cat_food',   label:'Play a Food & Composting quiz',icon:'🍎', type:'play_category',target:'food',    pts:20 },
  { id:'m_cat_ew',     label:'Play an E-Waste quiz',         icon:'💻', type:'play_category',target:'ewaste',  pts:20 },
  { id:'m_acc80',      label:'Score 80%+ on a quiz',         icon:'🎓', type:'accuracy',     target:80,        pts:35 },
  { id:'m_acc100',     label:'Score 100% on a quiz',         icon:'💎', type:'accuracy',     target:100,       pts:50 },
  { id:'m_powerup',    label:'Use a power-up during a quiz', icon:'🚀', type:'powerup_use',  target:1,         pts:15 },
];

/* ============================================================
   PROFILE FRAMES
   ============================================================ */
const FRAMES = [
  { id:'frame_none',     label:'None',     css:'',               desc:'No frame'                   },
  { id:'frame_green',    label:'Forest',   css:'frame-green',    desc:'Lush green ring'             },
  { id:'frame_blue',     label:'Ocean',    css:'frame-blue',     desc:'Calm blue glow'              },
  { id:'frame_gold',     label:'Gold',     css:'frame-gold',     desc:'Shining gold ring'           },
  { id:'frame_rainbow',  label:'Rainbow',  css:'frame-rainbow',  desc:'All the colors!'             },
  { id:'frame_fire',     label:'Fire',     css:'frame-fire',     desc:'Blazing hot ring'            },
  { id:'frame_purple',   label:'Amethyst', css:'frame-purple',   desc:'Deep purple glow'            },
  { id:'frame_silver',   label:'Silver',   css:'frame-silver',   desc:'Shimmering silver ring'      },
  { id:'frame_rose',     label:'Rose',     css:'frame-rose',     desc:'Soft pink glow'              },
  { id:'frame_ice',      label:'Frost',    css:'frame-ice',      desc:'Icy blue sparkle'            },
  { id:'frame_neon',     label:'Neon',     css:'frame-neon',     desc:'Blinding neon green'         },
  { id:'frame_shadow',   label:'Shadow',   css:'frame-shadow',   desc:'Dark charcoal ring'          },
  { id:'frame_crimson',  label:'Crimson',  css:'frame-crimson',  desc:'Deep red pulse'              },
  { id:'frame_electric', label:'Electric', css:'frame-electric', desc:'Electric cyan flash'         },
  { id:'frame_emerald',  label:'Emerald',  css:'frame-emerald',  desc:'Rich emerald glow'           },
  { id:'frame_cosmic',   label:'Cosmic',   css:'frame-cosmic',   desc:'Swirling cosmic gradient'    },
  { id:'frame_galaxy',   label:'Galaxy',   css:'frame-galaxy',   desc:'Galaxy purple swirl'         },
  { id:'frame_sunset',   label:'Sunset',   css:'frame-sunset',   desc:'Warm orange-pink gradient'   },
  { id:'frame_lava',     label:'Lava',     css:'frame-lava',     desc:'Molten lava burst'           },
  { id:'frame_mint',     label:'Mint',     css:'frame-mint',     desc:'Cool teal mint ring'         },
  { id:'frame_void',     label:'Void',     css:'frame-void',     desc:'Deep space indigo pulse'     },
];

/* ============================================================
   DAILY SPIN PRIZES  (weighted — total weight = 100)
   ============================================================ */
const SPIN_PRIZES = [
  { pts:25,   weight:34, color:'#86efac', label:'25 pts'    },
  { pts:50,   weight:25, color:'#4ade80', label:'50 pts'    },
  { pts:75,   weight:16, color:'#22c55e', label:'75 pts'    },
  { pts:100,  weight:12, color:'#16a34a', label:'100 pts'   },
  { pts:150,  weight:7,  color:'#fbbf24', label:'150 pts'   },
  { pts:200,  weight:4,  color:'#f59e0b', label:'200 pts'   },
  { pts:500,  weight:1.5,color:'#ef4444', label:'500 pts!'  },
  { pts:1000, weight:0.5,color:'#8b5cf6', label:'1000 pts!!'},
];

function spinPrize() {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of SPIN_PRIZES) { r -= p.weight; if (r <= 0) return p; }
  return SPIN_PRIZES[0];
}

/* ============================================================
   RECYCLING FACTS  (shown as daily "Did you know?" on quiz home)
   ============================================================ */
const RECYCLING_FACTS = [
  'Recycling one aluminum can saves enough energy to power a TV for 3 hours.',
  'Americans throw away enough aluminum every three months to rebuild the entire US commercial aircraft fleet.',
  'Glass can be recycled endlessly without any loss in quality or purity.',
  'Recycling one ton of paper saves 17 trees, 7,000 gallons of water, and 380 gallons of oil.',
  'A plastic bottle takes up to 450 years to decompose in a landfill.',
  'The US recycles only about 9% of all plastic it generates.',
  'Recycling aluminum uses 95% less energy than producing it from raw ore.',
  'Food waste is the single largest category of material sent to US landfills, making up about 22% of the total.',
  'Making one glass bottle from recycled glass cuts air pollution by 20% and water pollution by 50%.',
  'The average American generates about 4.9 lbs of trash per day.',
  'Recycling 1 ton of cardboard saves 46 gallons of oil.',
  'E-waste makes up only 2% of trash in landfills, but represents 70% of overall toxic waste.',
  'Styrofoam (EPS) takes over 500 years to decompose — and it never fully biodegrades.',
  'A recycled aluminum can could be back on the shelf as a new product in as little as 60 days.',
  'Globally, only about 20% of e-waste is formally recycled each year.',
  'Plastic bags kill over 100,000 marine animals per year and never fully decompose.',
  'Germany has one of the world\'s highest recycling rates — over 65% of municipal waste.',
  'The first Earth Day, on April 22, 1970, launched the modern environmental movement in the US.',
  'Lithium-ion battery fires at recycling facilities have caused billions in damage — never put them in a bin.',
  'Composting food waste instead of landfilling it cuts methane emissions by up to 50% for that waste.',
  'TerraCycle recycles items that traditional programs can\'t — from chip bags to cigarette butts.',
  'Recycling paper produces 73% less air pollution than making it from scratch.',
  'A single quart of motor oil can contaminate up to 250,000 gallons of drinking water if dumped improperly.',
  'Over 80 billion aluminum cans are sold in the US annually — each one infinitely recyclable.',
  'The world generates over 50 million tonnes of e-waste per year — more than the weight of all commercial aircraft ever built.',
];
