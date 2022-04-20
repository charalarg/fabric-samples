import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-validate-certificate',
  templateUrl: './validate-certificate.component.html',
  styleUrls: ['./validate-certificate.component.scss']
})
export class ValidateCertificateComponent implements OnInit {
  certID!: string;
  valid: boolean = false;
  loading: boolean = false;
  certificate: any;
  certTransactions!: any[];
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getCert();
  }

  getCert(){
    this.route.params.subscribe(param=>{
      this.loading = true;
      this.certID = param['id'];
      if(param['id']){
        this.apiService.validateCertificate(param['id']).subscribe(res=>{
          console.log(res);
          this.certificate =res;
          this.loading = false;
        }, error => {
          // console.log(error);
          this.loading = false;
          this.valid = false;
          
        })
      } else{
        this.valid = false;
        this.loading = false;
      }
    });
  }
}
