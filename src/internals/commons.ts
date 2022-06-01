

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

         
    const horizontalscaleColorGen = (data, interpolatetype = 'rainbow') => d3.scaleOrdinal()
                            .domain(data.map(d => d.name))
                            .range(d3.quantize(t => 
                                colorGenInterpolatorDefs[interpolatetype](t * 0.8 + 0.1), data.length).reverse()
        );

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
    return {wrap, collisiondetection, horizontalscaleColorGen, pickBestContrast};
});