export const defaults = (function(d3){ 
    const gradescale = {
        colorgen: (data, field) => {
            var _data = data.filter(d => !/notreported/i.test(d[field])).map(d => d[field])
            , _gen = d3.scaleOrdinal()
            .domain(_data)
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), _data.length).reverse())
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
            var f = d3.format('.0%');
            var t = (t) => {
                switch(true) { 
                    case /notreported/i.test(t) : return 'Not Reported'; 
                    default: return t.toTitleCase()
            }};
            return `${t(d.data.type)}${d.data.count > 0 ? ` ${d.data.count}  Students ` : ' '}(${f(d.data.percent)})`;
         }
    }

    const attendance = {
        color : (v, t) => {
            
            if(t && /holiday/i.test(t)) return 'url(#diagonalHatch)';

            switch(v){
                case 'late': 
                   return '#E99002';
                 case 'absent':
                    return '#F04124';
                 case 'present':
                     return '#43ac6a';
                 default:
                     return '#b4b4b4';
            }
        }
    ,   valueformatter:  (d) => {
        var f = d3.format('.0%');
        var t = (t) => {
            switch(true) { 
                case /notreported/i.test(t) : return 'Not Reported'; 
                default: return t.toTitleCase()
        }};
        return `${t(d.data.type)} ${d.data.count} days (${f(d.data.percent)})`;
     }
    }

    const behavior_rating = {
        color: function(v, t) {
            if(t && /holiday/i.test(t)) return 'url(#diagonalHatch)';

            if(!v) return '#b4b4b4';

             var _v = parseInt(v);
             return _v >= 0 && _v <= 1 ? '#F04124' :
                     _v <= 3 ? '#E99002' :
                     '#43ac6a';
        }
    }

    const behavior_yesno = {
        color: function(v, t) {

                if(t && /holiday/i.test(t)) return 'url(#diagonalHatch)';
                if(v == null) return '#b4b4b4';

                var _v = parseInt(v);
                return _v == 0 ? '#F04124' : '#43ac6a';
                
        }
    }
    return  {attendance, behavior_rating, behavior_yesno, gradescale};
});


 