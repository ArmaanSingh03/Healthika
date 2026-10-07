// DATA layer. Swap for API/DB later. All values per 100 g / 100 ml, approximate.
const NUT = [['kcal','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g'],['fiber','Fiber','g'],['sugar','Sugar','g'],['sodium','Sodium','mg'],['calcium','Calcium','mg'],['iron','Iron','mg'],['potassium','Potassium','mg'],['magnesium','Magnesium','mg'],['vitD','Vitamin D','µg'],['b12','Vitamin B12','µg'],['vitC','Vitamin C','mg'],['zinc','Zinc','mg']];
const CATS = ['Dairy','Eggs','Soya','Fruits','Meals','Grains','Pulses & Legumes','Nuts & Seeds','Packaged','Protein Supplements'];
const ML = [['100 ml',100],['200 ml',200],['250 ml',250],['500 ml',500],['1 litre',1000]];
// v order = NUT order. s = serving options [label, grams/ml] (configurable standard weights).
const F = (id, name, cat, unit, v, s, alias) => ({ id, name, cat, unit, alias: alias || name.toLowerCase(),
  n: Object.fromEntries(NUT.map((k, i) => [k[0], v[i]])), s: unit === 'ml' ? s : [...s, ['100 g', 100]],
  meta: { source: 'Manual starter entry, typical published ranges', date: '2026-10', status: 'estimated' } });

const FOODS = [
  F('milk-full','Full Cream Milk','Dairy','ml',[67,3.2,4.8,4.1,0,4.8,44,120,0.1,150,11,0.1,0.4,1,0.4],ML),
  F('milk-toned','Toned Milk','Dairy','ml',[58,3.1,4.8,3,0,4.8,44,120,0.1,150,11,0.1,0.4,1,0.4],ML,'milk'),
  F('milk-dt','Double Toned Milk','Dairy','ml',[45,3.1,4.9,1.5,0,4.9,44,120,0.1,150,11,0.1,0.4,1,0.4],ML),
  F('milk-skim','Skimmed Milk','Dairy','ml',[35,3.4,5,0.1,0,5,42,122,0,156,11,0,0.4,1,0.4],ML),
  F('paneer','Paneer','Dairy','g',[296,18,3.4,23,0,2,30,200,0.2,100,10,0.1,0.8,0,2.5],[['1 cube (25 g)',25],['50 g',50]]),
  F('paneer-lf','Low-fat Paneer','Dairy','g',[190,20,4,10,0,2,30,200,0.2,100,10,0.1,0.8,0,2.5],[['1 cube (25 g)',25],['50 g',50]]),
  F('dahi','Dahi (Curd)','Dairy','g',[60,3.1,4.4,3.3,0,4,46,120,0.1,150,12,0,0.4,1,0.5],[['1 katori (100 g)',100],['1 bowl (200 g)',200]],'dahi|curd|yogurt'),
  F('greek','Greek Yogurt','Dairy','g',[97,9,4,5,0,4,35,110,0,141,11,0,0.5,0,0.5],[['1 cup (170 g)',170]]),
  F('yogurt','Regular Yogurt','Dairy','g',[61,3.5,4.7,3.3,0,4.7,46,120,0.1,155,12,0,0.4,1,0.5],[['1 cup (200 g)',200]]),
  F('buttermilk','Buttermilk (Chaas)','Dairy','ml',[40,3,4.8,1,0,4.8,105,110,0,150,10,0,0.3,0,0.4],ML,'buttermilk|chaas'),
  F('egg','Whole Egg','Eggs','g',[143,12.6,0.7,9.5,0,0.4,142,56,1.8,138,12,2,0.9,0,1.3],[['1 egg (50 g)',50]],'egg(?! white)'),
  F('eggwhite','Egg White','Eggs','g',[52,11,0.7,0.2,0,0.7,166,7,0.1,163,11,0,0.1,0,0],[['1 white (33 g)',33]],'egg white'),
  F('soychunks','Soy Chunks (dry)','Soya','g',[345,52,33,0.5,13,0,20,350,20,1800,280,0,0,0,4],[['1 small bowl (30 g)',30],['50 g',50]],'soy chunks|soya chunks'),
  F('tofu','Tofu','Soya','g',[76,8,2,4.8,0.3,0.6,7,350,5.4,121,30,0,0,0,0.8],[['1 serving (100 g)',100]]),
  F('soymilk','Soy Milk','Soya','ml',[40,3,3,2,0.5,2,12,25,0.5,120,15,0,0,0,0.3],ML,'soy milk'),
  F('banana','Banana','Fruits','g',[89,1.1,23,0.3,2.6,12,1,5,0.3,358,27,0,0,8.7,0.15],[['1 small (81 g)',81],['1 medium (118 g)',118],['1 large (136 g)',136]]),
  F('apple','Apple','Fruits','g',[52,0.3,14,0.2,2.4,10,1,6,0.1,107,5,0,0,4.6,0.04],[['1 medium (180 g)',180]]),
  F('orange','Orange','Fruits','g',[47,0.9,12,0.1,2.4,9,0,40,0.1,181,10,0,0,53,0.07],[['1 medium (130 g)',130]]),
  F('mango','Mango','Fruits','g',[60,0.8,15,0.4,1.6,14,1,11,0.2,168,10,0,0,36,0.1],[['1 medium (200 g)',200]]),
  F('guava','Guava','Fruits','g',[68,2.6,14,1,5.4,9,2,18,0.3,417,22,0,0,228,0.2],[['1 medium (100 g)',100]]),
  F('papaya','Papaya','Fruits','g',[43,0.5,11,0.3,1.7,8,8,20,0.3,182,21,0,0,61,0.1],[['1 bowl (150 g)',150]]),
  F('watermelon','Watermelon','Fruits','g',[30,0.6,8,0.2,0.4,6,1,7,0.2,112,10,0,0,8,0.1],[['1 bowl (150 g)',150]]),
  F('grapes','Grapes','Fruits','g',[69,0.7,18,0.2,0.9,15,2,10,0.4,191,7,0,0,3,0.1],[['1 bowl (100 g)',100]]),
  F('pomegranate','Pomegranate','Fruits','g',[83,1.7,19,1.2,4,14,3,10,0.3,236,12,0,0,10,0.35],[['1 bowl (100 g)',100]]),
  F('pineapple','Pineapple','Fruits','g',[50,0.5,13,0.1,1.4,10,1,13,0.3,109,12,0,0,48,0.1],[['1 bowl (150 g)',150]]),
  F('roti','Roti / Chapati','Meals','g',[300,9.5,55,4.5,5,1,10,30,3,200,60,0,0,0,1.5],[['1 roti (40 g)',40]],'roti|chapati'),
  F('paratha','Paratha (plain)','Meals','g',[326,7,45,13,3,1,350,30,2.5,150,45,0,0,0,1.2],[['1 paratha (80 g)',80]]),
  F('rice','Cooked White Rice','Grains','g',[130,2.7,28,0.3,0.4,0,1,10,0.2,35,12,0,0,0,0.5],[['1 bowl (150 g)',150],['1 katori (100 g)',100]],'rice'),
  F('oats','Oats (dry)','Grains','g',[389,17,66,7,10,1,2,54,4.7,429,177,0,0,0,4],[['1 serving (40 g)',40]]),
  F('dal','Dal (cooked)','Meals','g',[110,6,16,2.5,4,1,250,25,1.5,250,35,0,0,1,1],[['1 kadchi (80 g)',80],['1 bowl (150 g)',150]],'dal'),
  F('rajma','Rajma (cooked)','Meals','g',[130,7.5,20,2,6,1,250,40,2.2,380,40,0,0,1,1],[['1 kadchi (80 g)',80],['1 bowl (150 g)',150]],'rajma'),
  F('chole','Chole (cooked)','Meals','g',[160,8,22,4.5,6,3,300,50,2.5,350,45,0,0,2,1.4],[['1 kadchi (80 g)',80],['1 bowl (150 g)',150]],'chole'),
  F('khichdi','Khichdi','Meals','g',[115,4,19,2.5,2,0.5,300,20,1,150,25,0,0,0,0.6],[['1 bowl (200 g)',200]],'khichdi'),
  F('raita','Raita','Meals','g',[60,3,5,3,0.2,4,200,100,0.1,140,10,0,0.3,1,0.4],[['1 katori (100 g)',100]],'raita'),
  F('sabzi','Mixed Veg Sabzi','Meals','g',[90,2,10,4.5,3,3,300,30,1,250,20,0,0,10,0.4],[['1 katori (100 g)',100]],'sabzi'),
  F('chickpeas','Chickpeas (boiled)','Pulses & Legumes','g',[164,8.9,27,2.6,7.6,4.8,7,49,2.9,291,48,0,0,1.3,1.5],[['1 bowl (150 g)',150]]),
  F('peanuts','Peanuts','Nuts & Seeds','g',[567,26,16,49,8.5,4,18,92,4.6,705,168,0,0,0,3.3],[['1 handful (30 g)',30]]),
  F('almonds','Almonds','Nuts & Seeds','g',[579,21,22,50,12.5,4,1,269,3.7,733,270,0,0,0,3.1],[['5 almonds (6 g)',6],['1 handful (28 g)',28]]),
  F('bar','Protein Bar (generic)','Packaged','g',[380,30,35,13,5,10,200,150,2,200,50,0,0,0,1],[['1 bar (60 g)',60]]),
  F('whey','Whey Protein Powder (generic)','Protein Supplements','g',[400,80,10,6.7,0,3,250,300,0,0,0,0,0,0,0],[['1 scoop (30 g)',30]],'whey|protein shake|scoop')
];

// SUPPLEMENTS: DEMO data only (fictional brands/prices). Replace via admin/API.
const _id = (a) => a.map((p, i) => ({ ...p, id: 's' + i, demo: true }));
const pr = (brand, productName, proteinType, flavor, packSize, price, servingSize, servings, calories, protein, carbs, fat, sugar, bcaa, leucine, ingredients, sweetener, vegetarian, certification, rating) =>
  ({ brand, productName, category: 'protein', proteinType, flavor, packSize, price, servingSize, servings, calories, protein, carbs, fat, sugar, bcaa, leucine, ingredients, sweetener, vegetarian, certification, rating });
const PROTEIN = _id([
  pr('Demo Brand A','Whey Concentrate 1kg','Whey','Chocolate',1000,2499,30,33,120,24,3,2,1,5.5,2.5,'Whey concentrate, cocoa','Sucralose',true,'Lab tested (demo)',4.3),
  pr('Demo Brand B','Whey Isolate 2kg','Whey','Vanilla',2000,6499,33,60,118,27,1,0.5,0.5,6,2.9,'Whey isolate, flavour','Stevia',true,'Informed Choice (demo)',4.6),
  pr('Demo Brand C','Whey Blend 1kg','Blend','Coffee',1000,1999,30,33,125,22,4,2.5,2,5,2.3,'Whey blend, coffee','Acesulfame K',true,'None listed',4.0),
  pr('Demo Brand D','Casein 1kg','Casein','Chocolate',1000,3199,33,30,120,24,3,1,1,5,2.2,'Micellar casein, cocoa','Sucralose',true,'Lab tested (demo)',4.2),
  pr('Demo Brand E','Plant Protein 1kg','Plant','Unflavoured',1000,2299,32,31,125,24,3,2,0,5,2,'Pea + rice protein','None',true,'Vegan (demo)',4.1),
  pr('Demo Brand F','Soy Protein 1kg','Plant','Vanilla',1000,1299,30,33,110,23,2,1,0.5,4.5,1.8,'Soy protein isolate','Sucralose',true,'None listed',3.8),
  pr('Demo Brand G','Egg Protein 900g','Egg','Chocolate',900,3499,30,30,115,24,2,1,1,5,2.1,'Egg white protein','Stevia',false,'None listed',4.0)
]);
const cr = (brand, productName, type, flavor, packSize, price, servingSize, creatine, servings, ingredients, certification, rating) =>
  ({ brand, productName, category: 'creatine', creatineType: type, flavor, packSize, price, servingSize, creatine, servings, ingredients, certification, rating });
const CREATINE = _id([
  cr('Demo Brand A','Creatine Monohydrate 250g','Monohydrate','Unflavoured',250,899,3,3,83,'Creatine monohydrate','Lab tested (demo)',4.5),
  cr('Demo Brand B','Micronized Creatine 300g','Monohydrate','Unflavoured',300,1099,3,3,100,'Micronized creatine monohydrate','Creapure (demo)',4.7),
  cr('Demo Brand C','Creatine Blend 400g','Blend','Fruit punch',400,1599,5,3.5,80,'Creatine, flavour, citrate','None listed',3.9),
  cr('Demo Brand D','Creatine HCl 120g','HCl','Unflavoured',120,1299,1.5,1.5,80,'Creatine HCl','None listed',4.0)
]);
