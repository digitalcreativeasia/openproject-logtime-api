function durToHours(duration) {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
    match = match.slice(1).map(function(x) {
      if (x != null) {
          return x.replace(/\D/, '');
      }
    });
  
    var hours = (parseInt(match[0]) || 0);
    var minutes = (parseInt(match[1]) || 0);
    var seconds = (parseInt(match[2]) || 0);
  
    return ((hours * 3600 + minutes * 60 + seconds) / 3600).toFixed(1)
    ;
  }
