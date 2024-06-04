/*---------------------------------------------------------------
File Name : /controllers/PacketContoroller.ts
Creator : Song Si Joon
Compiler : tsc
Copyright : Song Si Joon
Description : 
Create Date : 2024-02-14
Last Modified : 2024-02-14
----------------------------------------------------------------*/
import { EventHandler } from './EventHandler';

// Packet 헤더 설정
class transport_header_t {
	static SZ: number;
	paylen: number;
	buf: any;

	constructor(paylen: number)
	{
		this.paylen = paylen;
		transport_header_t.SZ = 5;
	}

	static depktize(buf: any)
	{
		//console.log('XXX', buf, buf.length);
		if (buf.length < transport_header_t.SZ) {
			return false;
		}

		if (String.fromCharCode(buf[0]) != 'L') {
			throw new Error('Invalid endianess');
		}

		const paylen = buf.readUInt32LE(PacketContoroller.PKTLEN_I);

		return new transport_header_t(paylen);
	}

	pktize()
	{
		let cur = 0;
		const header = Buffer.alloc(transport_header_t.SZ);

		// endianess
		header.write('L', cur++);
		header.writeUInt32LE(this.paylen, cur);

		return header;
	}

	pkt_size()
	{
		return transport_header_t.SZ + this.paylen;
	}
}


// Packet Controller
class PacketContoroller {
	buf: any;
	tr_code: number | string | undefined;
	err_code: number | string | undefined;
	sym_code: number | string | undefined;
	req_id: number | string | undefined;
	private header: any;
	payload: any;

    static PKTLEN_I : number = 1;
    static VER_I : number = 7;
    static CTYPE_I: number = 8;
    static TRCODE_I : number = 9;
    static ERROR_I : number = 13;
    static PAYLEN_I : number = 17;
    static SYM_CODE_I : number = 29;
    static REQID_I : number = 34;
    static CIP_I : number = 90;
    static PAYLOAD_I : number = 154;
    static HEADER_SZ: number  = 149;
    static REQID_SZ: number  = 32;
    static CIP_SZ : number = 16;
    static TAIL_SZ : number = 4;
    static TAIL : string = "\0EOP";

	constructor(buf: any)
	{
		if (Number.isInteger(buf)) {
			this.buf = Buffer.alloc(buf);
		} 
		else {
			this.buf = Buffer.from(buf);
		}
	}

	size()
	{
		return this.buf.length;
	}

	// 서버에서 return된 데이터 디패키징
	static depktize(buf: any)
	{
		// 헤더에 들어있는 사이즈 확인하여 디패키징
		const theader = transport_header_t.depktize(
			buf.slice(0, transport_header_t.SZ)
		);

		// TODO: size check
		if ( !theader
		  || buf.length < theader.pkt_size())
		{
			return false;
		}

		const rv = new PacketContoroller(buf.slice(0, theader.pkt_size()));
		rv.parse();
		return rv;
	}

	// 설정된 규칙대로 버퍼 해석
	parse()
	{
		this.tr_code = this.buf.readInt32LE(PacketContoroller.TRCODE_I);
		this.err_code = this.buf.readInt32LE(PacketContoroller.ERROR_I);

		this.sym_code = this.buf.readInt32LE(PacketContoroller.SYM_CODE_I);

		// trim() doesn't remove '\0';
		this.req_id = this.buf.slice(
				PacketContoroller.REQID_I,
				PacketContoroller.REQID_I + PacketContoroller.REQID_SZ
				).toString().replace(/\0/g, '').trim();

		const data_len = this.buf.readUInt32LE(PacketContoroller.PAYLEN_I);

		this.header = this.buf.slice(0, PacketContoroller.PAYLOAD_I);

		this.payload = this.buf.slice(
				PacketContoroller.PAYLOAD_I,
				PacketContoroller.PAYLOAD_I + data_len
			);

	}

	// for some idiosyncratic servers
	update_header(header: any)
	{
		if (!header) return;

		if (header instanceof Function) {
			return header(this)
		}

		if (Buffer.isBuffer(header)) {
			// 요청 들어왔던 HEADER 데이터값 PACKET 크기만 변경하여 그대로 전달
			const pkt_len = PacketContoroller.HEADER_SZ + this.payload.length + PacketContoroller.TAIL_SZ;

			// update packet length
			header.writeUInt32LE(pkt_len, PacketContoroller.PKTLEN_I);
			header.copy(this.buf, 0, 0, PacketContoroller.PAYLOAD_I - 1);
		}
	}

	// 서버로 보내기전 패킷화
	static pktize(tr_code: string | number, req_id: string, payloadOrError: any, header: any)
	{
		tr_code = Number(tr_code);

		let client_ip = '';

		let _pktize;
		if (Buffer.isBuffer(payloadOrError)) {
			_pktize = this.pktize_normal;
		}
		else if (Number.isInteger(payloadOrError)) {
			_pktize = this.pktize_error;
		}
		else if (typeof payloadOrError === 'object') {
			client_ip = payloadOrError.clientIp || '';
			delete payloadOrError.clientIp;
			
			payloadOrError = Buffer.from(JSON.stringify(payloadOrError));
			_pktize = this.pktize_normal;
		}
		else {
			throw new Error('Invalid arg');
		}

		return _pktize(tr_code, req_id, payloadOrError, header, client_ip);
	}

	// Packet화
	static pktize_normal(tr_code: string | number, req_id: string, payload: any, header: any, client_ip='')
	{
		const paylen = payload.length;
		const pkt_len = PacketContoroller.HEADER_SZ + paylen + PacketContoroller.TAIL_SZ;
		const theader = new transport_header_t(pkt_len);

		const sendPacket = new PacketContoroller(pkt_len + transport_header_t.SZ);

		theader.pktize().copy(sendPacket.buf);

		sendPacket.buf.write('E', PacketContoroller.VER_I);
		sendPacket.buf.write('H', PacketContoroller.CTYPE_I);

		sendPacket.tr_code = tr_code;
		sendPacket.buf.writeInt32LE(tr_code, PacketContoroller.TRCODE_I);

		sendPacket.err_code = 0;

		sendPacket.buf.writeUInt32LE(paylen, PacketContoroller.PAYLEN_I);
		
		sendPacket.req_id = req_id.trim();
		req_id = req_id.padStart(PacketContoroller.REQID_SZ, "\0"); // 앞쪽부터 빈값은 \0 로 채우기
		//console.log('req_id', `"${req_id}"`, req_id.length);
		//console.log(dump(Buffer.from(req_id)));
		sendPacket.buf.write(req_id, PacketContoroller.REQID_I);

		
		client_ip = client_ip.padEnd(PacketContoroller.CIP_SZ,"\0"); // 뒷쪽 빈값은 \0 로 채우기
		sendPacket.buf.write(client_ip, PacketContoroller.CIP_I);

		payload.copy(sendPacket.buf, PacketContoroller.PAYLOAD_I);
		sendPacket.payload = payload;

		sendPacket.update_header(header);

		// TAIL
		sendPacket.buf.write(PacketContoroller.TAIL, PacketContoroller.PAYLOAD_I + payload.length);

		return sendPacket;
	}


	// Packet 에러처리
	static pktize_error(tr_code: string | number, req_id: string, err_code: string, header: any)
	{
		const paylen = 0;
		const pkt_len = PacketContoroller.HEADER_SZ + paylen + PacketContoroller.TAIL_SZ;
		const theader = new transport_header_t(pkt_len);

		const sendPacket = new PacketContoroller(pkt_len + transport_header_t.SZ);

		theader.pktize().copy(sendPacket.buf);

		sendPacket.buf.write('E', PacketContoroller.VER_I);
		sendPacket.buf.write('H', PacketContoroller.CTYPE_I);

		sendPacket.tr_code = tr_code;
		sendPacket.buf.writeInt32LE(tr_code, PacketContoroller.TRCODE_I);

		sendPacket.buf.writeInt32LE(err_code, PacketContoroller.ERROR_I);
		sendPacket.err_code = err_code;

		sendPacket.buf.writeUInt32LE(paylen, PacketContoroller.PAYLEN_I);

		sendPacket.req_id = req_id.trim();
		req_id = req_id.padStart(PacketContoroller.REQID_SZ, "\0");
		sendPacket.buf.write(req_id, PacketContoroller.REQID_I);

		sendPacket.payload = Buffer.alloc(0);

		sendPacket.update_header(header);

		// TAIL
		sendPacket.buf.write(PacketContoroller.TAIL, PacketContoroller.PAYLOAD_I + err_code.length);

		return sendPacket;
	}

	_proc_idata(EventController: EventHandler, socket: any)
	{
		const pkt = PacketContoroller.depktize(this.buf); // 현재 총 버퍼에서 일정 크기의 버퍼 가져오기
		if (!pkt) return false;

		EventController.TcpDataHandler(socket, pkt);

		this.buf = Buffer.from(this.buf.slice(pkt.size())); // 총버퍼 잘려나간 버퍼 제외하여 다시 할당

		return true; // 이벤트 컨트롤러로 해당 버퍼 return
	}

};


export { PacketContoroller };