/*---------------------------------------------------------------
File Name : /controllers/trproc/TrProcess.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 
Create Date : 2024-02-19
Last Modified : 2024-02-19
----------------------------------------------------------------*/

import type { InterfaceType } from "typescript";

/**
 * TrProcess
 */
abstract class CTrProcess {
    private tr: String;
 
    constructor(tr: String) {
        this.tr = tr;
    }
 
    abstract reqValidateCheck(data: any): Promise<boolean>; // 요청 데이터 필수값 체크
    abstract resValidateCheck(data: any): Promise<boolean>; // 응답 데이터 필수값 체크
    abstract resDataMake(data: any): Promise<any>; // 응답 데이터 제작
}
 
export { CTrProcess };
