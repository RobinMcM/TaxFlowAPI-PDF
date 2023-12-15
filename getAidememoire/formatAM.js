import fetch from "node-fetch";

async function aidememore (ClientID, AMSelectionType, RowCount) {
    // The token passed to the API and the color settings for the Header and Text [A,B,C, A,B,C, A,B,C] A=API, B=Background Color, C=Text Color
    //A = Questions sent to Client, B = Questions which have been disabled, C = Questions which are not required 
    const AMSelection = ['AideMemoire', 'AideMemoireDisabled', 'AideMemoireNotRequired','#9bddff', '#DE7B92', '#8E8787','#0033cc', '#000000','#ffffff',]
    const AMHeader = [
        // Aide Memoire Questions to be processed by the client (Required)
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr><td rowspan="2" style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #9bddff;">&nbsp;</td><td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 1</strong></td></tr>
            <tr><td style="color: #002387;"><strong>&nbsp;&nbsp;Information based on your previous year's return</strong></td></tr>
        </table><br />`,
        //Aide Memoire Questions which have been Disabled by the TaxFlow Manager 
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr><td rowspan="2"  style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #DE7B92;">&nbsp;</td><td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 1*</strong></td></tr>
            <tr><td style="color: #002387;"><strong>&nbsp;&nbsp;Not included in your current tax return</strong></td></tr>
        </table><br />`,
        //Aide Memoire Question which are currently available but not required.
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr><td rowspan="2"  style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #8E8787;">&nbsp;</td><td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 2</strong></td></tr>
            <tr><td style="color: #002387;"><strong>&nbsp;&nbsp;Other possible areas to consider for your current tax return</strong></td></tr>
        </table><br />`
    ]
    var apiEndpoint = `http://localhost:8900/api/${AMSelection[AMSelectionType]}/${ClientID}`;
    const res = await fetch(apiEndpoint);
    //console.log(apiEndpoint)
    let checkRowCount = RowCount;
    if( !res.ok) {
        throw new Error(`HTTP error ${res.status}`);
    }
    
    if(AMSelectionType === 1 || AMSelectionType === 2 ){checkRowCount = checkRowCount - 5};
    const data =  await res.json();
    var qs  = ''
    var hd = ''
    var result = ''
    let row_count = 5 
    let check_page = 0
    var cp = ''
    let page_size = 52
    let table_count = 0
    var new_page = AMHeader[AMSelectionType] 
    
    // Loops through the JSON Data to grab the entries, this has to be paged according to the page size 
    for(let i = 0; i < data.length; i++){
        if (qs != data[i].QuestionSet){
            row_count = row_count + 1 // this is the heading section currently one line
            qs = data[i].QuestionSet
            //check the size of the next table to force a new page if it wont fit
            check_page = 3 // this is the opening section of the page
            for(let c = 0; c < data.length; c++){ 
                if (data[c].QuestionSet == qs){
                    check_page = check_page + Number(data[c].Display)
                    if ( data[c].NarrativeType != cp && data[c].NarrativeType.length > 0) {
                        check_page ++ 
                    }
                    cp = data[c].NarrativeType
                }
            }
            // if this will not fit onto the same page then generate a new page 
            if( row_count + check_page >= page_size){
                    for(let n = row_count + table_count; n <= page_size; n ++ ){
                        new_page = new_page + '<br />&nbsp;' // this just inserts line-breaks (with space) to go to the next page
                    }
                    row_count = 0
                    table_count = 0
            }
            // Start building the table Header Stage
            result = result + new_page + '<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">' 
                                       + '<tr style="text-align: center; background-color: ' + AMSelection[AMSelectionType + 3] + '; color: ' + AMSelection[AMSelectionType + 6] + '; border: 1px solid black; border-collapse: collapse;"><td ><strong>' 
                                       + data[i].QuestionSet + '</strong></td><td></td></tr>'
            //insert the data into the Row sections
            for (let h = 0; h < data.length; h++){
                //The Header (Question Set) has changed so insert this into a row
                if (data[h].QuestionSet == qs){
                    if ( data[h].NarrativeType != hd) {
                        //The Request Type has changed (Narrative Type) so insert this into a new row
                        if (data[h].NarrativeType.length > 0){
                        result = result + '<tr><td style="padding-left: 25px; border: 1px solid black; border-collapse: collapse; color: blue; "><strong>'  
                                        + data[h].NarrativeType + '</strong></td><td></td></tr>'}
                        row_count = row_count + Number(data[h].Display)
                    }
                    hd = data[h].NarrativeType
                    //we can now insert the Description (Narrative) and the Status into the Row
                    result = result + '<tr><td style="width:75%; padding-left: 50px; border: 1px solid black; border-collapse: collapse;">' 
                                    + data[h].Narrative + '</td><td style="padding-left:15px; border: 1px solid black; border-collapse: collapse;">' 
                                    + data[h].Status + ' (' + data[h].Display + ')</td></tr>'
                    row_count = row_count + Number(data[h].Display)
                }
            }
            //inc the variables for a new line and close the Table
            row_count ++
            table_count ++ 
            result = result + '</table><br />' 
            new_page = ''
        }

    }
    return {result, row_count}
}

export default aidememore 