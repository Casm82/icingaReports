"use strict";
window.addEventListener("load", pageLoaded, false);

function pageLoaded(){
    var hrsArray = document.getElementsByClassName("timeHrs");
    var minArray = document.getElementsByClassName("timeMin");
    var avgTimeIdleStr = document.getElementById("avgTimeIdleStr");
    var avgTimeIdleDiv = document.getElementById("avgTimeIdleDiv");

    for ( var i=0; i < hrsArray.length; i++) {
	    hrsArray[i].addEventListener("change", calcAvg, false);
	};

	for ( var i=0; i < minArray.length; i++) {
	    minArray[i].addEventListener("change", calcAvg, false);
	};

    function calcAvg()
    {
      function sumArray(data)
      {
        var sum=0;
        for (var i=0; i < data.length; i++)
          {
            sum += Number(data[i].value)
          }
        return sum;
      };

      var avgIdleMinCalc = (60*sumArray(hrsArray) + sumArray(minArray))/minArray.length;
      var avgTimeIdleHrs = Math.floor(avgIdleMinCalc/60);
      var avgTimeIdleMin = Math.round(avgIdleMinCalc - avgTimeIdleHrs*60);

      avgTimeIdleStr.innerHTML = avgTimeIdleHrs + "ч " + avgTimeIdleMin + "м";

      if (avgTimeIdleHrs < 4) {avgTimeIdleDiv.style.background = "lime"};
      if ((avgTimeIdleHrs >= 4) && (avgTimeIdleHrs < 8)) {avgTimeIdleDiv.style.background = "yellow"};
      if (avgTimeIdleHrs >= 8) {avgTimeIdleDiv.style.background = "red"};
    };

};
