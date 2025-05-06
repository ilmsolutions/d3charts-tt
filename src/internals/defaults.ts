export const defaults = (function(d3, commons){ 
    const {horizontalscaleColorGen} = commons;
 
    const gradescale = {
        colorgen: (data, field, interpolatetype) => {
            var _data = data.filter(d => !/notreported/i.test(d[field])).map(d => d[field])
            , _gen = horizontalscaleColorGen(_data.map(d => Object.assign({name: d})), interpolatetype)
           ;
 
           return (v, t) => {
               switch(v){
                   case 'notreported':
                         return '#b4b4b4';
                   default:
                         return _gen(v);
               }
           }
        }    
        ,   valueformatter:  (d) => {
            var f = commons.formatters.percent;
            var t = (t) => {
                switch(true) { 
                    case /notreported/i.test(t) : return 'Not Reported'; 
                    default: return t.toTitleCase()
            }};
            return `${t(d.data.type)}${d.data.count > 0 ? ` ${d.data.count}  Students ` : ' '}(${f(d.data.percent)})`;
         }
    }

    const calendar_view = {
        color: function(zdomain, colorscheme){
            let zscale = d3.scaleOrdinal(zdomain, colorscheme);
            return (v, t, c) => {
                if(!t || /holiday/i.test(t)) return 'url(#diagonalHatch)'; 
                if(/noevent/i.test(v)) return '#b4b4b4';
                if(c) return c;
                return zscale(v);
            }

        }
    }
    return  {calendar_view, gradescale};
});


 