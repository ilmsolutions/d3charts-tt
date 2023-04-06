

const lrgb_luminance = ([r, g, b] : number[]) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const rgb_lrgb = ({ r, g, b }) => {
    return [r / 255, g / 255, b / 255].map(rgb_lrgb1);
}
const rgb_lrgb1 = (v) => {
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}


export const commons = ((d3) => {
    const colorGenInterpolatorDefs = {
        spectral: d3.interpolateSpectral 
      , rainbow: d3.interpolateRainbow
    };

    const contrast = (backcolor, forecolor) => {
        const bcl = lrgb_luminance(rgb_lrgb(d3.rgb(backcolor)))
            , fcl = lrgb_luminance(rgb_lrgb(d3.rgb(forecolor)))
            , c = (Math.max(bcl, fcl) + 0.05) / (Math.min(bcl, fcl) + 0.05)
            ;
        return c;
    };

    const pickBestContrast = (backColor, forecolors) => {
        let fmap = forecolors.map(d => {
            let cr = contrast(backColor, d);
            return {
                d, cr, contrast: cr > 4.5
            };
        }).filter(d => d.contrast).sort((a, b) => b.cr - a.cr)
        ;
        return fmap && fmap[0] && fmap[0].d;
    };

   
    const horizontalscaleColorGen = (data, interpolatetype = 'rainbow') => {

        let _interpolator =  /datacolor/i.test(interpolatetype) ? 
                          d3.interpolateDiscrete(data.map(d => d.color), data.length) :
                          colorGenInterpolatorDefs[interpolatetype]
        ,  _quantizer = d3.quantize(t => _interpolator(t * 0.8 + 0.1), data.length)

        return d3.scaleOrdinal()
                           .domain(data.map(d => d.name))
                           .range(/datacolor/i.test(interpolatetype) ? _quantizer : _quantizer.reverse())
    }

    const wrap = (text, width, lineHeight) => {
        lineHeight = lineHeight ? lineHeight : 1;
        text.each(function () {
            var _text = d3.select(this),
                words = _text.text().split(/[\s\n]+/).reverse(),
                word,
                line = [],
                y = _text.attr("y"),
                dy = parseFloat(_text.attr("dy")),
                dx = text.attr('dx') ? parseFloat(text.attr('dx')) : 0,
                tspan = _text.text(null).append("tspan").attr("x", 0).attr("y", y)
                          .attr("dy", dy + "em").attr('dx', dx + 'em');
    
            while (word = words.pop()) {
                line.push(word);
                //console.log(line.join(" "));
                tspan.text(line.join(" "));
                if (line.length > 1 && (tspan.node().getComputedTextLength() > width || /\\n.*/.test(word))) { //\\n is for new line character                   
                    word = word.replace('\\n', '');
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
    
                    tspan = _text.append("tspan").attr("x", 0).attr("y", y)
                              .attr("dy", (dy + lineHeight) + "em")
                              .attr('dx', dx + 'em')
                              .text(word);
                }
            }
        }); 
    }
    
    const  collisiondetection =  (selection, valueInit) => {
     
        valueInit = valueInit ? valueInit : function(s){       
            s.each(function(d){
                var t = this.transform 
                ,   tr = t ? t.baseVal.consolidate().matrix : null   
                ,   tprops = tr ? [tr.e, tr.f] : [0, 0];
                d3.select(this).datum(Object.assign({}, d.data, {_hvalue : tprops[0], _vvalue: tprops[1]}));            
            })
    
            return s;
        }
        var elems = selection.call(valueInit),
            alpha = 1,
            bb = elems.filter(function (d, i) { return i == 0; }).node().getBBox(),
            spacing = bb.height,
            relax = function () {
                var again = false;
                elems.each(function (a, i) {
                    var _elem = d3.select(this);
    
                    elems.filter(function (_e, _i) { return _i > i && d3.select(this).attr('text-anchor') == _elem.attr('text-anchor'); }).each(function (b, i) {
                        var _nelem = d3.select(this),
                            _dy = a._vvalue - b._vvalue;
                        //_dy = a.v[1] - b.v[1];
    
                        if (Math.abs(_dy) < spacing) {
                            again = true;
                            var sign = _dy > 0 ? 1 : -1;
                            //console.log('before ' + a._vvalue + ' ' + b._vvalue);
                            a._vvalue += sign * alpha;
                            b._vvalue -= sign * alpha;
                            //console.log('after ' + a._vvalue + ' ' + b._vvalue);
                        }
                    });
                });
    
                elems.each(function (a, i) {
                    //   console.log(a.v);
                    //console.log('in elem ' + a._hvalue + ' ' + a._vvalue);
                    d3.select(this).attr('transform', 'translate(' + a._hvalue + ', ' + a._vvalue + ')');
                });
    
                if (again) relax();
            };
    
        relax();
    
    }

    const scale = (type) => {
        switch(true){
           case /time/i.test(type):
               return d3.scaleBand();
        }
        return null;
    }

    const tickFormat = (type, subtype) => {
        let _formatter = d => d;
        switch(true){
            case /time/i.test(type):
                switch(subtype){
                    case 'week':
                        _formatter = d3.utcFormat("Week %U");
                        break;
                    case 'year':
                        _formatter = d3.utcFormat("Starting %b %y");
                        break;
                    case 'month':
                    default:
                        _formatter = d3.utcFormat("%b %y"); 
                        break;
                }
                return d => {
                    return _formatter(new Date(d));
                }
        }
        return null;
    }

    let _interpretnonvalue = (v) => 'No Data'
  ;  

    const formatters =  {
        percent: function (frmtr) {
            return function (v) {
                return !isNaN(v) ? frmtr(v).replace(/\.0*$/, '') + '%' :
                    _interpretnonvalue(v);//100.0 to drop trailing zeroes
            }
        }(d3.format(',.1f'))
        , count: function (frmtr) {
            return function (v) {
                return !isNaN(v) ? frmtr(v).replace(/\.0*$/, '') :
                    _interpretnonvalue(v);
            }
        }(d3.format(',.1f'))
        , time: function(frmtr){
          return function(v){
            if(!v) return '-';
            let now = d3.timeDay.floor(new Date());
            return frmtr(d3.timeMinute.offset(now, v))
                        .replace(/^0?([0-9]*)(?:\:00|(\:[0-9]*))\s(am|pm)/ig, `$1$2 $3`);
          };
        }( d3.timeFormat("%I:%M %p"))
    }

    let   _xposition = (mouse, container, elem, threshold) => {
        if(container.width - (mouse.x + elem.x + elem.width) < threshold ){
          mouse.x = mouse.x - elem.x - elem.width;
        }
        else
          mouse.x += elem.x;

        return  {left: mouse.x};
    }
    , _yposition = (mouse, container, elem, threshold) => {
        if(container.height - (mouse.y + elem.y + elem.height) < threshold)
        {
          mouse.y = mouse.y - elem.y - elem.height;
        }
        else
          mouse.y += elem.y; 

        return {top: mouse.y};
    };

    const tooltip = () => {
        var _t = d3.select('body')
                   .selectAll('div.viz.tooltip')
                   .data([0]).join('div').attr('class', 'viz tooltip')
          , timer;

          _t.selectAll('div.tooltip-inner')
            .data([0]).join('div').attr('class', 'tooltip-inner');
  
        var tip =  {
            hidetip: () => { 
                _t.transition().duration('500').style('opacity', 0);              
                window.clearTimeout(timer);
                timer = window.setTimeout(function(){
                  if(_t.node().style.opacity < 0.9)
                     _t.classed('d-none', true);
                }, 500)
               return tip;
            }
            , showtip: () => {
               let _c = {x: 0, y: 0, width: window.innerWidth, height: window.innerHeight} 
               ,   _br = _t.node().getBoundingClientRect()
               ,   _e = {x: 25, y: 25, width: _br.width, height: _br.height}
               ,   _m = {x: d3.event.pageX, y: d3.event.pageY}
               ,   _xpos = _xposition(_m, _c, _e, 75)
               ,   _ypos = _yposition(_m, _c, _e, 75)
               ;
                _t.classed('d-none', false)
                  .style('left', _xpos.left + 'px')
                  .style('top',  _ypos.top + 'px')
                _t.transition().delay(200).style('opacity', 0.9)
               return tip;
            } 
            , content: (html) => {
               _t.selectAll('div.tooltip-inner')
                 .data([html])
                 .join('div').attr('class', 'tooltip-inner')
                 .html(function(d){return d;});
               return tip;
            }
        };
  
        return tip;
    }

    const makeDayTimeIntervals = (step) =>{
        let d = new Date(`01-01-2023 00:00:00`) 
        , frmt = d3.timeFormat("%I:%M %p")
        ,   off = dd => d3.timeMinute.count(d, dd)
        ;
        return d3.timeMinute.every(step).range(d3.timeDay.floor(d), d3.timeDay.offset(d, 1))
                 .map(dd => Object.assign({}, {label: frmt(dd), value: off(dd)}));
      }
   
    const makeWeekDayIntervals = (from, to) => {
        return d3.timeDay.every(1).range(d3.timeDay.floor(from), d3.timeDay.ceil(to));
    }
    return {wrap, collisiondetection, horizontalscaleColorGen, pickBestContrast
           , scale, tickFormat, formatters, tooltip, makeDayTimeIntervals};
});