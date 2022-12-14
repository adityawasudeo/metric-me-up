// based on code from https://github.com/esprimo/imperial-to-metric-chrome-extension

'use strict';

const intOrFloat = '([0-9]+([,\\.][0-9]+)?)';
const unitSuffix = '([^a-zA-Z]|$)';

const toConvert = [
  { regex: new RegExp('(' + intOrFloat + ' ?mi(les?)?)' + unitSuffix, 'ig'),    unit: 'km', multiplier: 1.60934  },
  { regex: new RegExp('(' + intOrFloat + ' ?f(ee|oo)?t)' + unitSuffix, 'ig'),   unit: 'm',  multiplier: 0.3048   },
  { regex: new RegExp('(' + intOrFloat + ' ?yards)' + unitSuffix, 'ig'),        unit: 'm',  multiplier: 0.9144   },
  { regex: new RegExp('(' + intOrFloat + ' ?(pound|lb)s?)' + unitSuffix, 'ig'), unit: 'kg', multiplier: 0.453592 },
  { regex: new RegExp('(' + intOrFloat + ' ?gallons?)' + unitSuffix, 'ig'),     unit: 'L',  multiplier: 3.78541  },
  { regex: new RegExp('(' + intOrFloat + ' ?stones?)' + unitSuffix, 'ig'),      unit: 'kg', multiplier: 6.35029  },
  { regex: new RegExp('(' + intOrFloat + ' ?in(ch|ches)?)' + unitSuffix, 'ig'), unit: 'cm', multiplier: 2.54     },
  { regex: new RegExp('(' + intOrFloat + ' ?fl oz?)' + unitSuffix, 'ig'),       unit: 'ml', multiplier: 29.594   },
  { regex: new RegExp('(' + intOrFloat + ' ?quart?)' + unitSuffix, 'ig'),       unit: 'L',  multiplier: 0.946    },
];

const tempExp = new RegExp('(' + intOrFloat + ' ?°F?)' + unitSuffix, 'ig')

function convert(originalAmount, multiplier) {
    let convertedAmount = originalAmount * multiplier;
    // round to two decimals
    convertedAmount = Math.round(convertedAmount * 100) / 100;
  
    return convertedAmount;
  }

function convertForOutput(originalAmount, unitIndex) {
    const multiplier  = toConvert[unitIndex].multiplier;
    const unit        = toConvert[unitIndex].unit;
  
    // remove , if any
    originalAmount = originalAmount.replace(/,/g, '');
  
    // Acutal number convertion
    const convertedAmount = convert(originalAmount, multiplier);
    // Format converted value for output (always add a space before)
    // Will be for example:  (13.37 m)
    const convertedString = `${convertedAmount} ${unit}`;
  
    return convertedString;
}
  
function convertUnits(text) {
    let modified = false;
    let mtext = text;
    const len = toConvert.length;
    for (let i = 0; i < len; i++) {
        if (text.search(toConvert[i].regex) !== -1) { 
            let matches;
            while ((matches = toConvert[i].regex.exec(text)) !== null) { 
                const fullMatch  = matches[1];
                const originalAmount = matches[2];
                const convertedString = convertForOutput(originalAmount, i);
                const rText = '<div class=tooltip>'+fullMatch+' <span class="tooltiptext">'+convertedString+'</span> </div>';
                mtext = text.slice(0,matches.index)+rText+text.slice(matches.index+fullMatch.length);
                modified = true;
            }
        }    
    }
    return {modified:modified, text:mtext};
}

function convertTemperature(text) {
    let modified = false;
    let mtext = text;
    let matches;
    while ((matches = tempExp.exec(text)) !== null) { 
        const fullMatch  = matches[1];
        const originalAmount = matches[2];
        console.log(fullMatch + " "+ originalAmount);
        let convertedAmount = (originalAmount - 32) * (5/9);
        convertedAmount = Math.round(convertedAmount * 100) / 100;
        const convertedString = convertedAmount + '°C';
        const rText = '<div class=tooltip>'+fullMatch+' <span class="tooltiptext">'+convertedString+'</span> </div>';
        mtext = text.slice(0,matches.index)+rText+text.slice(matches.index+fullMatch.length);
        modified = true;
    }
    return {modified:modified, text:mtext};
  }

function handleText(textNode) {
    let text = textNode.nodeValue;
    const unitObj = convertUnits(text);
    const tempObj = convertTemperature(unitObj.text);

    if(unitObj.modified == true || tempObj.modified == true) {
        var replacementNode = document.createElement('span');
        replacementNode.innerHTML = tempObj.text;
        textNode.parentNode.insertBefore(replacementNode, textNode);
        textNode.parentNode.removeChild(textNode);
    }
    
}

function walk(node) {
    // I stole this function from here:
    // http://is.gd/mwZp7E
  
    let child;
    let next;
  
    switch (node.nodeType) {
      case 1:  // Element
      case 9:  // Document
      case 11: // Document fragment
        child = node.firstChild;
        while (child) {
          next = child.nextSibling;
          const tagName = child.tagName;
          if (tagName !== 'SCRIPT' && tagName !== 'STYLE') walk(child);
          child = next;
        }
        break;
  
      case 3: // Text node
        
        handleText(node);
        break;
      default:
        break;
    }
}

walk(document.body);
