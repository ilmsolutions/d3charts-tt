import * as d3 from 'd3';
import {d3pie} from './internals/d3pie';
import {d3histogram} from './internals/d3histogram';
import {d3calendar} from './internals/d3calendar';
import {d3eventcalendar} from './internals/d3eventcalendar';
import {d3horizontalscale} from './internals/d3horizontalscale';
import {d3timeline} from './internals/d3timeline';
import { d3bar } from './internals/d3bar';
import {commons} from './internals/commons'; 
import {defaults} from './internals/defaults';
import {defs} from './internals/defs';
import {layerdefs} from './internals/layerdefs';


export const d3commons = commons(d3); 
const d3defaults = defaults(d3, d3commons);
const d3defs = defs(d3);
const d3layerdefs = layerdefs(d3);

export const d3chart = (type, config?) => {

     let types = type.split('.');
     let cdefaults = types[1] && d3defaults[types[1]];
     let clayerdefs = d3layerdefs && d3layerdefs[types[0]] && {layerdefs: d3layerdefs[types[0]] } || {};
     let cconfig = Object.assign({}, cdefaults || {}, clayerdefs, config || {});  
  
     //add defs 
     cconfig.patterns && d3defs.adddefs(cconfig);   
     
     switch(types[0]){
         case 'pie':
           return d3pie(d3, d3commons)(cconfig);
         case 'histogram':
           return d3histogram(d3, d3commons)(cconfig);
         case 'calendar':
           return d3calendar(d3, d3commons)(cconfig);
        case 'eventcalendar':
          return d3eventcalendar(d3, d3commons)(cconfig);
        case 'horizontalscale':
          return d3horizontalscale(d3, d3commons)(cconfig);
        case 'timeline':
          return d3timeline(d3, d3commons)(cconfig);    
        case 'bar':
          return d3bar(d3,  d3commons)(cconfig);                  
     }


}