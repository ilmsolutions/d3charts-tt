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
            
            if(!t || /holiday/i.test(t)) return 'url(#diagonalHatch)';

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
        color: function(v, t = '') {
            if(!t || /holiday/i.test(t)) return 'url(#diagonalHatch)';

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


    const behavior_notes = {
        color: function(v, t) {

                if(t && /holiday/i.test(t)) return 'url(#diagonalHatch)';
                return v ? '#43ac6a' : '#b4b4b4';
        }
    }

    return  {attendance, behavior_rating, behavior_yesno, behavior_notes, gradescale};
});


 