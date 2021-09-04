import RestDataSource from "../src/datasource/rest.datasource";

import http from 'http';
import { Request } from "../src/types/datasource.types";
import { AddressInfo } from "net";

import request from "supertest"

jest.useFakeTimers();

const expectedReturn = {
    test: "Ok"
}

describe("Rest DataSource API", () => {
    var restDatasource : any;
    let baseURI : string;

    const server = http.createServer((req, res) => {
        if(req.method === 'GET'){
            res.writeHead(200, {
                'content-type': 'application/json'
            });
            res.write(JSON.stringify(expectedReturn));
            res.end();
            res.socket?.unref();
        }
    });

    beforeEach((done) => {


        server.close.bind(server);
    
        server.listen();

        baseURI = `http://localhost:${(server.address() as AddressInfo)?.port}/`;


        restDatasource = new (class extends RestDataSource{
        
            protected onRequest(request: Request<unknown>): Promise<void> {
                return Promise.resolve();
            }

            constructor(){
                super(baseURI)
            }

            testGet(){
                return this.get("/test")
            }

            testPost(){
                return this.post("/test", {
                    body: {
                        id: "1"
                    }
                })
            }
        });

        done();
    });


    afterEach((done) => {
        server.close(done);
    })

    


    





    describe("Initiating API endpoint", ()=> {

        it("should return 200 status code", async () => {
            const result = await request(server).get("/");
            expect(result.body).toEqual(expectedReturn);
        })
    })

    describe("Executing get call on API", () => {
 
        it("should return expected object", async () => {
            const result = await restDatasource.testGet();
            expect(result.body).toEqual(expectedReturn);
        })

        it("should have memoized property set to true", async () => {
            await restDatasource.testGet();
            const result = await restDatasource.testGet();
            expect(result.memoized).toBeTruthy();
        })


    })

    describe('Execution of DataSource class', () => {
        it("should call performRequest on non-GET request", async () => {
            restDatasource.performRequest = jest.fn().mockReturnValue(expectedReturn)
            const spy = jest.spyOn(restDatasource, 'performRequest');
            console.log(await restDatasource.testPost());

            expect(spy).toBeCalled();

            spy.mockRestore();

        })
    })

    afterAll(() => {
        server.close();
    })
    

});