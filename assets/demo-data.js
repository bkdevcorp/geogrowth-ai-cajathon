(()=>{'use strict';
// All values here are invented for the hackathon. Geographic coordinates are illustrative only.
const source='Escenario sintético · GeoGrowth AI';
const zones={bandeja:{dep:'Arequipa',dist:'Arequipa (Cercado)',ubigeo:'040101',lat:-16.3989,lng:-71.5369},expansion:{dep:'San Martín',dist:'Moyobamba',ubigeo:'220101',lat:-6.0342,lng:-76.9747},desatendidos:{dep:'La Libertad',dist:'Trujillo',ubigeo:'130101',lat:-8.1116,lng:-79.0287},estacionales:{dep:'Arequipa',dist:'Arequipa (Cercado)',ubigeo:'040101',lat:-16.3989,lng:-71.5369}};
const names={bandeja:[['Comercio','Tienda'],['Alimentos y gastronomía','Panadería'],['Servicios y otros','Taller'],['Comercio','Bazar'],['Alimentos y gastronomía','Cafetería'],['Servicios y otros','Lavandería']],expansion:[['Comercio','Distribuidora'],['Alimentos y gastronomía','Restaurante'],['Servicios y otros','Veterinaria'],['Comercio','Ferretería'],['Alimentos y gastronomía','Panadería'],['Servicios y otros','Academia']],estacionales:[['Comercio','Juguetería'],['Comercio','Tienda de ropa'],['Alimentos y gastronomía','Panadería'],['Comercio','Bazar de regalos'],['Alimentos y gastronomía','Pastelería'],['Comercio','Textiles'],['Comercio','Librería'],['Comercio','Papelería'],['Servicios y otros','Hotel'],['Alimentos y gastronomía','Restaurante'],['Agricultura','Insumos agrícolas'],['Agricultura','Semillas y fertilizantes']]};
const newBusinesses=[
 ['Comercio','Bodega','Bodega Santa Catalina','abastecimiento y rotación de inventario'],
 ['Alimentos y gastronomía','Panadería','Panadería El Buen Horno','insumos y capacidad de producción'],
 ['Servicios y otros','Taller automotriz','Taller Misti Motors','herramientas y repuestos'],
 ['Comercio','Ferretería','Ferretería Los Pinos','inventario de materiales'],
 ['Alimentos y gastronomía','Cafetería','Café Sillar','equipamiento e insumos'],
 ['Comercio','Librería','Librería Nuevo Horizonte','stock de útiles escolares'],
 ['Servicios y otros','Lavandería','Lavandería Agua Clara','equipamiento y servicios'],
 ['Alimentos y gastronomía','Restaurante','Cocina Valle del Chili','insumos y mobiliario'],
 ['Comercio','Textiles','Textiles Cumbre Blanca','abastecimiento de prendas'],
 ['Servicios y otros','Barbería','Barbería Portal del Sol','herramientas y acondicionamiento'],
 ['Comercio','Minimarket','Minimarket La Campiña','inventario de consumo diario'],
 ['Alimentos y gastronomía','Pastelería','Pastelería Dulce Sillar','hornos e ingredientes'],
 ['Servicios y otros','Veterinaria','Veterinaria Patitas del Misti','equipamiento e insumos'],
 ['Comercio','Zapatería','Calzados Valle Sur','stock de calzado'],
 ['Alimentos y gastronomía','Juguería','Juguería Amanecer Andino','fruta y refrigeración'],
 ['Servicios y otros','Imprenta','Imprenta Portal Blanco','papel y equipamiento'],
 ['Comercio','Floristería','Flores de la Campiña','inventario perecedero'],
 ['Alimentos y gastronomía','Picantería','Picantería Fogón del Valle','insumos de cocina'],
 ['Servicios y otros','Reparación de celulares','Conecta Misti','repuestos y herramientas'],
 ['Comercio','Bazar','Bazar Rincón del Sillar','inventario de productos variados']
];
const commercialNames={expansion:['Distribuidora Alto Mayo','Restaurante Sabor del Bosque','Veterinaria Huellas del Mayo','Ferretería Río Verde','Panadería Aroma de Orquídea','Academia Horizonte Amazónico'],estacionales:['Juguetería Mundo de Colores','Moda Portal del Sol','Panadería Trigal del Sur','Regalos Rincón Andino','Pastelería Nube de Azúcar','Textiles Valle Blanco','Librería Puente del Saber','Papelería La Estación','Hotel Mirador del Chili','Restaurante Sabor de la Campiña','Agroinsumos Valle Fértil','Semillas Sur Andino']};
const existingWords=['La Alameda','El Mirador','Cumbre del Sur','Valle Alegre','Los Sauces','Portal Andino','La Pradera','El Molino','Las Terrazas','Sol Naciente','Los Olivos','La Ribera','Camino Real','El Bosque'];
const districtLabels=['Sector Mirador del Valle','Sector Alameda del Norte','Sector Camino del Sol','Sector Portal Verde','Sector Los Sauces','Sector Ribera Alta'];
const cutoff='2026-10-28',asOf='2026-11-26';
 const profiles=[
 [24000,4500,24,8500,1,0],[32000,6400,18,9000,1,0],[35000,8500,36,12500,2,0],
 [42000,7200,30,18000,2,0],[18000,3200,12,4500,1,0],[15000,2600,0,null,null,null],
 [16000,3000,15,6500,1,0],[38000,6700,22,13000,2,1],[29000,5100,28,11000,2,0],
 [12000,2200,0,null,null,null],[48000,7800,32,22000,2,0],[22000,4300,14,7000,1,0],
 [26000,4900,26,9500,1,0],[19000,3100,20,8000,1,1],[14000,2500,0,null,null,null],
 [28000,5500,30,10500,2,0],[17500,2800,16,5000,1,0],[33000,6300,24,12000,2,0],
 [21000,3700,12,6000,1,0],[23500,3900,18,7500,1,0]];
 function profile(r,i,module="bandeja"){
  const [sales,net,months,debt,lenders,category]=profiles[i];
  return {synthetic:true,joinId:r.id,
   sunat:{source:'SUNAT · simulado',status:'Activo',condition:'Habido',activity:r.giro,identifier:r.id},
   sunarp:{source:'SUNARP · escenario ficticio',status:i%3===0?'Inscripción de persona jurídica simulada':'Sin asiento registral simulado',note:'No acredita propiedad, bienes ni solvencia. Verificar inscripción mediante canales autorizados.'},
   sbs:{source:'Central de Riesgos SBS · simulada',period:'octubre 2026',subject:module==='bandeja'?'Titular ficticio vinculado al negocio nuevo':'Titular ficticio del comercio seleccionado',months,category,debt,lenders},
   finance:{source:'Declaración y estados de cuenta ficticios · no SBS',period:'mes ilustrativo, proyección de operación',sales,net},
   inei:{source:'INEI · contexto territorial',status:'Sin indicador territorial validado para esta selección'},
   midagri:{source:'MIDAGRI · referencia sectorial',status:'Sin cruce validado',relevance:['Alimentos y gastronomía','Agricultura'].includes(r.sector)?'Posible vínculo con insumos agrícolas; validar proveedores y estacionalidad.':'No se ha identificado un vínculo agrícola en el escenario.'}
  };
 }
function population(){
 const z=zones.bandeja;
 const record=(entry,i,recent)=>{
  const [sector,giro,name,need]=entry,idx=i+1,angle=i*2.39996323,rad=.0025+Math.sqrt(i+1)*.0018;
  const date=recent?'2026-11-'+String(24-i).padStart(2,'0'):'2026-'+String(1+i%9).padStart(2,'0')+'-'+String(1+i%27).padStart(2,'0');
  return {id:(recent?'DEMO-01-':'DEMO-HIST-')+idx,nombre:name,label:name,dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector,giro,period:'2026',date,fecha:date,source,signal:recent?'Primera apertura registrada · simulada':'Registro anterior · simulado',kind:'business',synthetic:true,demoPosition:{lat:z.lat+Math.cos(angle)*rad,lng:z.lng+Math.sin(angle)*rad},direccion:'Sector ilustrativo '+(i%5+1)+' · referencia '+idx+' (no visitar)',estado:'VIGENTE',firstRegistration:date,priorRegistration:!recent,need};
 };
 // Separate simulated relationship evidence from business-opening evidence.
 const cartera=new Set([1,5,9,13,17].map(i=>'DEMO-01-'+i));
 const negativeChecks=new Set([2,6,10,14,18].map(i=>'DEMO-01-'+i));
 // Fictional cross-source records joined by a scenario ID, never a real RUC.
 const recent=newBusinesses.map((x,i)=>{const r=record(x,i,true);return {...r,profile:profile(r,i),cajaStatus:cartera.has(r.id)?'client':negativeChecks.has(r.id)?'nonclient':'pending',cajaEvidence:cartera.has(r.id)?'Coincidencia en cartera sintética':negativeChecks.has(r.id)?'Consulta de campo simulada: no trabaja con Caja':'Sin consulta de campo ni relación confirmada'};});
 const existing=existingWords.flatMap((word,j)=>newBusinesses.map(([sector,giro,,need],i)=>record([sector,giro,giro+' '+word,need],j*20+i,false)));
 return [...recent,...existing];
}
function isNew(x){return x.firstRegistration>=cutoff&&x.firstRegistration<=asOf&&!x.priorRegistration;}
const offsets=[[.003,.004],[-.004,.003],[.005,-.004],[-.005,-.003],[.001,.008],[-.001,-.008],[.007,.002],[-.007,.001],[.006,.007],[-.006,-.006],[.002,-.011],[-.003,.011]];
// Compare two simulated snapshots by stable business and establishment IDs.
const expansionNames=[
 ['Comercio','Distribuidora','Distribuidora Alto Mayo','abastecimiento del nuevo local'],
 ['Alimentos y gastronomía','Restaurante','Restaurante Sabor del Bosque','equipamiento de cocina'],
 ['Servicios y otros','Veterinaria','Veterinaria Huellas del Mayo','equipamiento veterinario'],
 ['Comercio','Ferretería','Ferretería Río Verde','inventario de materiales'],
 ['Alimentos y gastronomía','Panadería','Panadería Aroma de Orquídea','capacidad de producción'],
 ['Servicios y otros','Academia','Academia Horizonte Amazónico','mobiliario y material educativo'],
 ['Comercio','Minimarket','Minimarket Valle Esmeralda','inventario del segundo local'],
 ['Alimentos y gastronomía','Cafetería','Café Sendero del Mayo','máquinas y abastecimiento'],
 ['Servicios y otros','Taller automotriz','Taller Motores del Oriente','herramientas y repuestos'],
 ['Comercio','Librería','Librería Bosque de Letras','útiles y mobiliario'],
 ['Alimentos y gastronomía','Pastelería','Pastelería Flor de Cacao','hornos e ingredientes'],
 ['Servicios y otros','Lavandería','Lavandería Agua del Valle','maquinaria y acondicionamiento'],
 ['Comercio','Textiles','Textiles Selva Clara','stock y exhibición'],
 ['Alimentos y gastronomía','Juguería','Juguería Frutos del Mayo','refrigeración y fruta'],
 ['Servicios y otros','Barbería','Barbería Portal Amazónico','sillones y herramientas'],
 ['Comercio','Zapatería','Calzados Camino Verde','inventario y estanterías'],
 ['Alimentos y gastronomía','Pollería','Pollería Brasa del Bosque','equipos e insumos'],
 ['Servicios y otros','Imprenta','Imprenta Orquídea Azul','papel y equipos'],
 ['Comercio','Agroinsumos','Agroinsumos Tierra Fértil','stock para el nuevo punto'],
 ['Comercio','Bazar','Bazar Rincón del Mayo','inventario y exhibición']
];
function expansionPopulation(){
 const z=zones.expansion;
 const entries=[...expansionNames,...existingWords.flatMap(word=>expansionNames.map(([sector,giro,,need])=>[sector,giro,giro+' '+word,need]))];
 const before=[],current=[];
 const base=entries.map(([sector,giro,label,need],i)=>{
  const id='DEMO-02-'+(i+1),angle=i*2.39996323,rad=.004+Math.sqrt(i%20+1)*.0015;
  const prior={businessId:id,locationId:id+'-A',fecha:'2025-03-10',direccion:'Local anterior ficticio '+(i+1)+' (no visitar)',demoPosition:{lat:z.lat+Math.cos(angle)*rad,lng:z.lng+Math.sin(angle)*rad},active:true};
  before.push(prior);current.push({...prior});
  if(i<20)current.push({businessId:id,locationId:id+'-N',fecha:'2026-11-'+String(24-i).padStart(2,'0'),direccion:'Local nuevo ficticio '+(i+1)+' (no visitar)',demoPosition:{lat:prior.demoPosition.lat+.0018,lng:prior.demoPosition.lng+.0025},active:true});
  const cajaStatus=[1,4,8,12,16].includes(i)?'client':[2,5,9,13,17].includes(i)?'nonclient':'pending';
  return {id,nombre:label,label,dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector,giro,period:'2026',source,kind:'business',synthetic:true,estado:'VIGENTE',need,cajaStatus,cajaEvidence:cajaStatus==='client'?'Coincidencia en cartera sintética':cajaStatus==='nonclient'?'Consulta de campo simulada: no trabaja con Caja':'Relación con Caja pendiente de consulta'};
 });
 const group=list=>{const m=new Map();for(const l of list){if(!m.has(l.businessId))m.set(l.businessId,[]);m.get(l.businessId).push(l);}return m;};
 const priorIndex=group(before),currentIndex=group(current);
 return base.map((r,i)=>{
  const history=priorIndex.get(r.id)||[],locations=currentIndex.get(r.id)||[];
  const priorIds=new Set(history.map(l=>l.locationId)),added=locations.filter(l=>l.active&&!priorIds.has(l.locationId)&&!history.some(h=>h.direccion===l.direccion));
  const retained=history.filter(h=>locations.some(l=>l.active&&l.locationId===h.locationId&&l.direccion===h.direccion));
  const newest=added[0]||locations[0];
  return {...r,date:newest.fecha,fecha:newest.fecha,fecha_anterior:history[0]?.fecha,direccion:newest.direccion,demoPosition:newest.demoPosition,history,locations,addedLocations:added,retainedLocations:retained,direcciones_anteriores:history.length,direcciones_nuevas:added.length,signal:added.length?'Local adicional registrado · simulado':'Sin cambio de local · simulado',profile:profile(r,i%profiles.length,'expansion')};
 });
}
function isExpansion(r){
 const history=r.history||[],locations=r.locations||[];
 return history.some(h=>locations.some(l=>l.active&&l.locationId===h.locationId&&l.direccion===h.direccion))&&locations.some(l=>l.active&&l.fecha>=cutoff&&l.fecha<=asOf&&!history.some(h=>h.locationId===l.locationId||h.direccion===l.direccion));
}
function rows(id){
 if(id==='bandeja')return population();
 if(id==='expansion')return expansionPopulation();
 const z=zones[id];
 if(id==='desatendidos')return offsets.slice(0,6).map(([a,b],i)=>({id:'DEMO-03-'+(i+1),label:districtLabels[i],dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector:'',period:'2026',date:'2026 · simulado',source,signal:'Actividad comercial simulada · 0 oficinas',kind:'territory',synthetic:true,demoPosition:{lat:z.lat+a,lng:z.lng+b},empresas_2015:null,sbs_puntos_2025:null,demoMetrics:{businesses:180+i*47,mypes:165+i*41,offices:0,agents:2+i,cashiers:i%2}}));
 const needs=id==='expansion'?['abastecimiento del nuevo local','equipamiento de cocina','equipamiento veterinario','inventario de materiales','capacidad de producción','mobiliario y material educativo']:['inventario de juguetes','stock de prendas','insumos de panificación','inventario de regalos','ingredientes y hornos','abastecimiento textil','útiles escolares','papel y útiles','preparación de habitaciones','insumos de cocina','insumos para cultivo','semillas y fertilizantes'];
 return names[id].map(([sector,giro],i)=>{const [a,b]=offsets[i],label=commercialNames[id][i],date='2026-11-'+String(24-i).padStart(2,'0'),p={lat:z.lat+a,lng:z.lng+b};const r={id:'DEMO-'+({bandeja:'01',expansion:'02',estacionales:'04'}[id])+'-'+(i+1),nombre:label,label,dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector,giro,period:'2026',date,fecha:date,source,signal:id==='expansion'?'Local adicional simulado':id==='estacionales'?'Actividad estacional simulada':'Apertura simulada',kind:'business',synthetic:true,demoSeasons:id==='estacionales'?([['navidad'],['navidad','escolar'],['navidad','fiestas'],['navidad'],['navidad','fiestas'],['navidad','escolar'],['escolar'],['escolar'],['verano','fiestas'],['verano','fiestas'],['agro'],['agro']][i]):[],demoPosition:p,direccion:'Ubicación ficticia '+String.fromCharCode(65+i)+' (no visitar)',estado:'VIGENTE',...(id==='expansion'?{fecha_anterior:'2025-03-10',direcciones_anteriores:1,direcciones_nuevas:1,history:[{fecha:'2025-03-10',direccion:'Local anterior ficticio '+String.fromCharCode(65+i),demoPosition:{lat:p.lat-.0018,lng:p.lng-.0025}}]}:{})};const cajaStatus=['pending','client','nonclient','pending','client','nonclient'][i%6];return {...r,need:needs[i],cajaStatus,cajaEvidence:cajaStatus==='client'?'Coincidencia en cartera sintética':cajaStatus==='nonclient'?'Consulta de campo simulada: no trabaja con Caja':'Relación con Caja pendiente de consulta',profile:profile(r,i,id)};});
}
window.GeoGrowthDemo={rows,source,isNew,isExpansion,cutoff,asOf};
})();