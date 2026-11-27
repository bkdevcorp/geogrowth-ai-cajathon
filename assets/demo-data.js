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
 const recent=newBusinesses.map((x,i)=>{const r=record(x,i,true);return {...r,cajaStatus:cartera.has(r.id)?'client':negativeChecks.has(r.id)?'nonclient':'pending',cajaEvidence:cartera.has(r.id)?'Coincidencia en cartera sintética':negativeChecks.has(r.id)?'Consulta de campo simulada: no trabaja con Caja':'Sin consulta de campo ni relación confirmada'};});
 const existing=existingWords.flatMap((word,j)=>newBusinesses.map(([sector,giro,,need],i)=>record([sector,giro,giro+' '+word,need],j*20+i,false)));
 return [...recent,...existing];
}
function isNew(x){return x.firstRegistration>=cutoff&&x.firstRegistration<=asOf&&!x.priorRegistration;}
const offsets=[[.003,.004],[-.004,.003],[.005,-.004],[-.005,-.003],[.001,.008],[-.001,-.008],[.007,.002],[-.007,.001],[.006,.007],[-.006,-.006],[.002,-.011],[-.003,.011]];
function rows(id){
 if(id==='bandeja')return population();
 const z=zones[id];
 if(id==='desatendidos')return offsets.slice(0,6).map(([a,b],i)=>({id:'DEMO-03-'+(i+1),label:districtLabels[i],dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector:'',period:'2026',date:'2026 · simulado',source,signal:'Actividad comercial simulada · 0 oficinas',kind:'territory',synthetic:true,demoPosition:{lat:z.lat+a,lng:z.lng+b},empresas_2015:null,sbs_puntos_2025:null,demoMetrics:{businesses:180+i*47,mypes:165+i*41,offices:0,agents:2+i,cashiers:i%2}}));
 return names[id].map(([sector,giro],i)=>{const [a,b]=offsets[i],label=commercialNames[id][i],date='2026-11-'+String(24-i).padStart(2,'0'),p={lat:z.lat+a,lng:z.lng+b};return {id:'DEMO-'+({bandeja:'01',expansion:'02',estacionales:'04'}[id])+'-'+(i+1),nombre:label,label,dep:z.dep,dist:z.dist,ubigeo:z.ubigeo,sector,giro,period:'2026',date,fecha:date,source,signal:id==='expansion'?'Local adicional simulado':id==='estacionales'?'Actividad estacional simulada':'Apertura simulada',kind:'business',synthetic:true,demoSeasons:id==='estacionales'?([['navidad'],['navidad','escolar'],['navidad','fiestas'],['navidad'],['navidad','fiestas'],['navidad','escolar'],['escolar'],['escolar'],['verano','fiestas'],['verano','fiestas'],['agro'],['agro']][i]):[],demoPosition:p,direccion:'Ubicación ficticia '+String.fromCharCode(65+i)+' (no visitar)',estado:'VIGENTE',...(id==='expansion'?{fecha_anterior:'2025-03-10',direcciones_anteriores:1,direcciones_nuevas:1,history:[{fecha:'2025-03-10',direccion:'Local anterior ficticio '+String.fromCharCode(65+i),demoPosition:{lat:p.lat-.0018,lng:p.lng-.0025}}]}:{})};});
}
window.GeoGrowthDemo={rows,source,isNew,cutoff,asOf};
})();