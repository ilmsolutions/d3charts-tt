export const defs = (d3) => {
    const adddefs = (includes?) => {
        d3.select(document.documentElement).selectAll('svg.defs')
          .data([[includes]])
          .join('svg').attr('class', 'defs')
          .call(_defs);
     }
     
     const _defs = (s) => {
         var dfs =  s.selectAll('defs')
                     .data(d => d)
                     .join('defs');
     
         dfs.selectAll('pattern')
            .data(d => d.patterns)
            .join('pattern')
            .attr('id', d => d)
            .each(function(d){
                d3.select(this).call(patterns[d]);
            });
     
          return s;
     }
     
     const patterns = {
         diagonalHatch: (pattern) => {
             pattern 
             .attr('patternUnits', 'userSpaceOnUse')
             .attr('width', 4).attr('height', 4)
             .attr('patternTransform', 'rotate(-45 2 2)')
             .append('path').attr('d', 'M -1,2 l 6, 0')
             .attr('stroke-width', 0.5);
         }
     }

     return {adddefs}
}