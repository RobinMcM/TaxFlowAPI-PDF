const dotenv = require( 'dotenv');
dotenv.config();
const sql = require('mssql');

const config = {
    user: process.env.USER, 
    password: process.env.PASSWORD, 
    server: process.env.SERVER, 
    database: process.env.DATABASE, 
    authentication: {
        type: 'default'
    },
    port: 1433,
    options: {
        trustedconnection: true,
        enableArithAbort: true,
        encrypt: true
    }
};

async function getClientToken(ClientID){
    try {
        var pool = await sql.connect(config);
        let companyToken = await pool.request().query(
            `
                declare @ClientID nvarchar(18)  = ${ClientID}
                select 
                ClientGUID 
                from ClientDetails where id = @ClientID
            `
        )
        return companyToken.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getCompanyToken(ClientID){
    try {
        var pool = await sql.connect(config);
        let companyToken = await pool.request().query(
            `
                declare @ClientID nvarchar(18)  = ${ClientID}
                select 
                Variable 
                from Variables where type = 'CompanyAccessGuid'
            `
        )
        return companyToken.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getClientAideMemoire(ClientID){
    try{
        var pool = await sql.connect(config);
        let AMRequired = await pool.request().query(
            `
                declare @ClientID nvarchar(18)  = ${ClientID}
                declare @organisation nvarchar(50) = (Select AllocatedTo from ClientDetails where id = @clientID)
                declare @TaxYear nchar(4) = (select Variable from Variables where Type = 'CurrentYear')
                declare @TaxYear1I int = CAST(@TaxYear as int) -1
                declare @TaxYear1S nchar(4) = CAST(@TaxYear1I as nchar(4))
                declare @TaxYear2I int = CAST(@TaxYear as int) -2
                declare @TaxYear2S nchar(4) = CAST(@TaxYear2I as nchar(4))
                Select 
                        cqs.QuestionSet, 
                        ISNULL(ast.NarrativeType, '') 
                                as 'NarrativeType',
                        REPLACE(
                            REPLACE(
                                REPLACE(ast.Narrative, 
                                    '[[Year]]', @TaxYear), 
                                        '[[Year-1]]',@TaxYear1S), 
                                            '[[Year-2]]',@TaxYear2S) 
                                as 'Narrative', 
                        ISNULL(CASE asr.Verified 
                                    WHEN 1 THEN 'Received' 
                                    WHEN 2 THEN 'Query'
                                    WHEN 3 THEN 'Pending'
                                    ELSE 'Not Recieved'
                                END
                        , '0') as 'Status',
                        (select top(1) RequirementOrder from RequirementGroups where RequirementName = cqs.QuestionSet) as ReqOrder,
                        isnull(ast.PDFRegionSize, 1) as Display
                        from ClientQuestionSets cqs
                            full outer join AssessmentStatus ast
                                on ast.RequirementGroup = cqs.QuestionSet
                            full outer join AssessmentResponse asr
                                on asr.AssessmentShortCode = ast.ShortCode and asr.ClientID = @clientID
                            full outer join ClientDetails cdt
                                on cdt.ID = @clientID
                where 
                    cqs.ClientID = @clientID and 
                    ast.OrganisationType = @organisation and 
                    isnull(asr.DisableNarrative, 0) = 0 and 
                    cqs.TaxYear = @TaxYear
                order by ReqOrder,  isnull(ast.NarrativeType, 'z')    
            `
        )
        return AMRequired.recordsets;

    }
    catch(error){
        console.log(error);
    }
}

async function getClientAidememoireDisabled(ClientID){
    try{
        var pool = await sql.connect(config);
        let AMDisabled = await pool.request().query(
            `
            declare @ClientID nvarchar(18)  = ${ClientID}
                declare @organisation nvarchar(50) = (Select AllocatedTo from ClientDetails where id = @clientID)
                declare @TaxYear nchar(4) = (select Variable from Variables where Type = 'CurrentYear')
                declare @TaxYear1I int = CAST(@TaxYear as int) -1
                declare @TaxYear1S nchar(4) = CAST(@TaxYear1I as nchar(4))
                declare @TaxYear2I int = CAST(@TaxYear as int) -2
                declare @TaxYear2S nchar(4) = CAST(@TaxYear2I as nchar(4))
                Select 
                        cqs.QuestionSet, 
                        ISNULL(ast.NarrativeType, '') 
                                as 'NarrativeType',
                        REPLACE(
                            REPLACE(
                                REPLACE(ast.Narrative, 
                                    '[[Year]]', @TaxYear), 
                                        '[[Year-1]]',@TaxYear1S), 
                                            '[[Year-2]]',@TaxYear2S) 
                                as 'Narrative', 
                        'Not Applicable' as Status,
                        (select top(1) RequirementOrder from RequirementGroups where RequirementName = cqs.QuestionSet) as ReqOrder,
                        isnull(ast.PDFRegionSize, 1) as Display
                        from ClientQuestionSets cqs
                            full outer join AssessmentStatus ast
                                on ast.RequirementGroup = cqs.QuestionSet
                            full outer join AssessmentResponse asr
                                on asr.AssessmentShortCode = ast.ShortCode and asr.ClientID = @clientID
                            full outer join ClientDetails cdt
                                on cdt.ID = @clientID
                where 
                    cqs.ClientID = @clientID and 
                    ast.OrganisationType = @organisation and 
                    isnull(asr.DisableNarrative, 0) = 1 and 
                    cqs.TaxYear = @TaxYear
                order by ReqOrder,  isnull(ast.NarrativeType, 'z') 
            `
        )
        return AMDisabled.recordsets;

    }
    catch(error){
        console.log(error);
    }
}

async function getClientAidememoireNotRequired(ClientID){
    try{
        var pool = await sql.connect(config);
        let AMNotRequired = await pool.request().query(
        `
        declare @ClientID nvarchar(18)  = ${ClientID}
            declare @organisation nvarchar(50) = (Select AllocatedTo from ClientDetails where id = @clientID)
            declare @TaxYear nchar(4) = (select Variable from Variables where Type = 'CurrentYear')
            declare @TaxYear1I int = CAST(@TaxYear as int) -1
            declare @TaxYear1S nchar(4) = CAST(@TaxYear1I as nchar(4))
            declare @TaxYear2I int = CAST(@TaxYear as int) -2
            declare @TaxYear2S nchar(4) = CAST(@TaxYear2I as nchar(4))
            Select 
                ast.RequirementGroup as 'QuestionSet', 
                ISNULL(ast.NarrativeType, '') 
                        as 'NarrativeType',
                REPLACE(
                    REPLACE(
                        REPLACE(ast.Narrative, 
                            '[[Year]]', @TaxYear), 
                                '[[Year-1]]',@TaxYear1S), 
                                    '[[Year-2]]',@TaxYear2S) 
                        as 'Narrative', 
                'Not Required' as Status,
                (select top(1) RequirementOrder from RequirementGroups where ast.RequirementGroup = RequirementName) as ReqOrder,
                ast.PDFRegionSize as 'Display'
                from AssessmentStatus ast
                full outer join AssessmentResponse asr
                on ast.ShortCode = asr.AssessmentShortCode
                where OrganisationType = @organisation and isnull(asr.ClientID, 0) = 0
            order by ReqOrder,  isnull(ast.NarrativeType, 'z') 
        `
        )
        return AMNotRequired.recordsets 
    }
    catch(error){
        console.log(error);
    }
}

module.exports = {
    getClientAideMemoire: getClientAideMemoire,
    getClientAidememoireDisabled: getClientAidememoireDisabled,
    getClientAidememoireNotRequired: getClientAidememoireNotRequired,
    getCompanyToken: getCompanyToken,
    getClientToken: getClientToken
}

