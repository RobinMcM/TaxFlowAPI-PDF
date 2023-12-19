import fetch from "node-fetch";

async function aidememore (ClientID, AMSelectionType, RowCount) {
    // The token passed to the API and the color settings for the Header and Text [A,B,C, A,B,C, A,B,C] A=API, B=Background Color, C=Text Color
    // A = Questions sent to Client, B = Questions which have been disabled, C = Questions which are not required 
    const AMSelection = [
                            'AideMemoire', 'AideMemoireDisabled', 'AideMemoireNotRequired', //Table Heading Type
                            '#9bddff', '#DE7B92', '#8E8787', // Background Color 
                            '#0033cc', '#000000','#ffffff', // Font Color 
                        ] 
    const AMHeader = [
        // Aide Memoire Questions to be processed by the client (Required)
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr>
                <td rowspan="2" style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #9bddff;">&nbsp;</td>
                <td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 1</strong></td>
            </tr>
            <tr>
                <td style="color: #002387;"><strong>&nbsp;&nbsp;Information based on your previous year's return</strong></td>
            </tr>
        </table> 
        5 <br />`,
        //Aide Memoire Questions which have been Disabled by the TaxFlow Manager. 
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr>
                <td rowspan="2"  style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #DE7B92;">&nbsp;</td>
                <td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 1*</strong></td>
            </tr>
            <tr>
                <td style="color: #002387;"><strong>&nbsp;&nbsp;Not included in your current tax return</strong></td>
            </tr>
        </table>
        <br />`,
        //Aide Memoire Question which are currently available but not required. (Other possiblities areas to Coinsider on your next tax return)
        `<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">
            <tr>
                <td rowspan="2"  style="width: 12px; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse; background-color: #8E8787;">&nbsp;</td>
                <td style="font-size: 28;"><strong>&nbsp;&nbsp;Step 2</strong></td>
            </tr>
            <tr>
                <td style="color: #002387;"><strong>&nbsp;&nbsp;Other possible areas to consider for your current tax return</strong></td>
            </tr>
        </table>
        <br />`
    ]
    //Grab the unformatted data from TaxFlow
    var apiEndpoint = `http://localhost:8900/api/${AMSelection[AMSelectionType]}/${ClientID}`;
    const res = await fetch(apiEndpoint);
    if( !res.ok) {
        throw new Error(`HTTP error ${res.status}`);
    }
    const data =  await res.json();

    let checkRowCount = RowCount; 
    if(AMSelectionType == 1 || AMSelectionType == 2 ){checkRowCount = checkRowCount};


    var qs  = '' // Table Heading Question Set -- Switch for the header i.e. Pensions Employment etc
    var hd = '' // Heading -- Additional Queries , Documents Required etc
    var cp = '' // this forces a change in the headings 
    var result = ''  // this is the AideMemoire Page for the formatting process which will be returned to the Browser 

    let check_page = 0 // this will loop through the table to assess the size 
    let table_count = 0

    var new_page_header = AMHeader[AMSelectionType] 
    let row_count = checkRowCount + 5 // this holds the row count for pagination and we allow 5 rows for the start
    let page_size = 51
    
    // Loops through the JSON Data to grab the entries, this has to be paged according to the page size 
    for(let i = 0; i < data.length; i++){
        if (qs != data[i].QuestionSet){
            qs = data[i].QuestionSet // Forces a header
            row_count = row_count + 1 // this is the heading section currently one line
            check_page = 0
            //check the size of the next table to force a new page if it wont fit
            for(let c = 0; c < data.length; c++){ 
                if (data[c].QuestionSet == qs){
                    check_page = check_page + Number(data[c].Display)
                    if ( data[c].NarrativeType != cp && data[c].NarrativeType.length > 0) {
                        check_page ++ 
                    }
                    cp = data[c].NarrativeType
                }
            }

            console.log(row_count, check_page)
            // if this will not fit onto the same page then generate a new page by inserting <br>'s 
            //table_count = 0
            //check_page = 0
            if( row_count + check_page >= page_size - 4){
                    for(let n = row_count + table_count; n <= page_size; n ++ ){
                        new_page_header = new_page_header.concat('(',  n,  ')<br />&nbsp;') // this just inserts line-breaks (with space) to go to the next page
                    }
                    row_count = 1
                    //check_page = 0
            }
            //check_page = 0
            // Start building the table Header Stage
            result = result + new_page_header.concat('<table style="width: 90%; margin-left: auto; margin-right: auto; border: 1px solid black; border-collapse: collapse;">', 
                                                '<tr style="text-align: center; background-color: ', 
                                                AMSelection[AMSelectionType + 3], '; color: ', AMSelection[AMSelectionType + 6], '; border: 1px solid black; border-collapse: collapse;"><td ><strong>',
                                                data[i].QuestionSet, '  ',  row_count, '  (', check_page ,')</strong></td><td></td></tr>'
                                            )
            //insert the data into the Row sections
            for (let h = 0; h < data.length; h++){
                //The Header (Question Set) has changed so insert this into a row
                if (data[h].QuestionSet == qs){
                    if ( data[h].NarrativeType != hd) {
                        //The Request Type has changed (Narrative Type) so insert this into a new row
                        row_count = row_count + 1
                        if (data[h].NarrativeType.length > 0){
                                                                result = result.concat('<tr><td style="padding-left: 25px; border: 1px solid black; border-collapse: collapse; color: blue; "><strong>',  
                                                                data[h].NarrativeType, ' - ', row_count, '</strong></td><td></td></tr>'
                                                                )}

                    }
                    hd = data[h].NarrativeType
                    //we can now insert the Description (Narrative) and the Status into the Row
                    row_count = row_count + Number(data[h].Display)
                    result = result.concat('<tr><td style="width:75%; padding-left: 50px; border: 1px solid black; border-collapse: collapse;">', 
                                    data[h].Narrative,'</td><td style="padding-left:15px; border: 1px solid black; border-collapse: collapse;">' ,
                                    data[h].Status, ' (', data[h].Display, ') {',  row_count, '}</td></tr>')
                }
            }
            //inc the variables for a new line and close the Table
            //row_count ++
            table_count ++ 
            result = result.concat('</table><br />')
            new_page_header = ''
        }

    }
    return {result, row_count}
}

export default aidememore 