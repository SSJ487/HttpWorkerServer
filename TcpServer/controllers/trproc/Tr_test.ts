/*---------------------------------------------------------------
File Name : /controllers/trproc/Tr_1234.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 
Create Date : 2024-02-19
Last Modified : 2024-02-19
----------------------------------------------------------------*/
import {CTrProcess} from './AbstractTrClass'
import { test_req, test_res } from '../../const/TrConst';
import { ValidationError, validate } from 'class-validator';
import { resolve } from 'bun';


/**
 * Tr_test
 */
class Tr_test extends CTrProcess{ 

    constructor(tr: string) {
        super(tr);
        console.log("Tr_test ", tr);
    }

    async reqValidateCheck(data: any): Promise<boolean> // 요청 데이터 필수값 체크
    {
        const reqdata = new test_req();
        reqdata.tr_code = data.tr_code;
        reqdata.user_id = data.user_id;
        reqdata.dmlaldjqtdma = data.dmlaldjqtdma;
        reqdata.name = data.name;
        reqdata.test = data.test;

        let errors: ValidationError[] =await validate(reqdata); // errors is an array of validation errors
        if (errors.length > 0) {
            //console.log('req validation failed. errors: ', errors);
            return false;

        } else {
            //console.log('req validation succeed  ', reqdata.tr_code );
            return true;
        }
    }

    async resValidateCheck(data: any): Promise<boolean> // 반환 데이터 필수값 체크
    {
        const resdata = new test_res();
        resdata.tr_code = data.tr_code;
        resdata.err_code = data.err_code;
        resdata.user_id = data.user_id;
        resdata.name = data.name;
        resdata.test = data.test;

        let errors: ValidationError[] =await validate(resdata); // errors is an array of validation errors
        if (errors.length > 0) {
            //console.log('res validation failed. errors: ', errors);
            return false;

        } else {
            //console.log('res validation succeed  ', resdata.tr_code );
            return true;
        }
    }

    async resDataMake(data: any): Promise<test_res>
    {
        let processed_data = new test_res();
        processed_data = <test_res>data;
        processed_data.test += "end...";
        processed_data.err_code = "10";
        return processed_data;
    }

    async doProc(data: any): Promise<any>
    {
        // 요청 데이터 필수값 체크
        let check_reqdata = await this.reqValidateCheck(data);

        if(check_reqdata)
        {
            let response_data = new test_res();
            response_data = await this.resDataMake(data);
            let check_resdata = await this.resValidateCheck(response_data);
            if(check_resdata)
                return response_data;
            else
            {
                response_data.err_code = "1999";
                return response_data;
            }
        }           
        else
        {
            let response_data = new test_res();
            response_data = data;
            response_data.err_code = "1999";
            return response_data;
        }
    }
}


export { Tr_test };
