import { IsUUID, Contains, IsInt, Length, IsEmail, IsFQDN,
    IsDate, Min, Max } from "class-validator";
  

export class USER_HEAD {
    @Length(1, 5)
    tr_code: string;

    @Length(3, 30)
    user_id: string;

    @Length(3, 30)
    dmlaldjqtdma: string;
}
  
export class USER_OUT {
    @Length(1, 5)
    tr_code: string;

    @Length(3, 30)
    user_id?: string;

    @Length(1, 4)
    err_code: string;
}

export class ERROR_OUT {
    @Length(1, 5)
    tr_code: string;

    @Length(3, 30)
    req_id?: string;

    @Length(1, 4)
    err_code: string;
}

export class PAGE_ROW_INFO {
    @Length(1, 10)
    total_count: string;

    @Length(1, 10)
    row_offset: string;

    @Length(1, 10)
    row_count: string;
};



export class test_req extends USER_HEAD  {
    @Length(2, 30)
    name: string;

    @Length(0, 100000)
    test?: string;
}
  
export class test_res extends USER_OUT {
    @Length(2, 30)
    name: string;

    @Length(0, 100000)
    test?: string;
}


  