import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { LocalStorageService } from 'ngx-webstorage';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-issue-certificate',
  templateUrl: './issue-certificate.component.html',
  styleUrls: ['./issue-certificate.component.scss']
})
export class IssueCertificateComponent implements OnInit {
  fieldForm!: FormGroup;
  isLoading: boolean = false;
  userID: string = '';
  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.getQueryParam();

  }

  ngAfterViewInit() {

  }

  initForm(params: Params) {
    console.log(params);
    this.fieldForm = this.formBuilder.group({}, { updateOn: 'change' });
    this.fieldForm.addControl('clientId', this.formBuilder.control(params, [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.controls['clientId'].updateValueAndValidity();
  }
  getQueryParam() {
    this.route.queryParams.subscribe(params => {
      console.log(params);
      if (params['userID']) {
        this.userID = params['userID'];
        this.initForm(params['userID']);
      } else {
        this.router.navigate(['/main/manage-users']);
      }

    })
  }
  submitForm() {
    if (this.fieldForm.valid) {
      this.apiService.issueCertificate(this.fieldForm.value).subscribe(async res => {
        console.log(res);
        
      });
    }
  }

}
