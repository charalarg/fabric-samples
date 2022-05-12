import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { LocalStorageService } from 'ngx-webstorage';
import { ApiService } from 'src/app/services/api.service';
import { ToastsService } from 'src/app/services/toast.servive';

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
    private apiService: ApiService,
    private toastService: ToastsService
  ) { }

  ngOnInit() {
    this.getQueryParam();

  }

  ngAfterViewInit() {

  }

  initForm(params: Params) {
    this.fieldForm = this.formBuilder.group({}, { updateOn: 'change' });
    this.fieldForm.addControl('clientId', this.formBuilder.control(params, [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('expires', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.addControl('title', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
    this.fieldForm.controls['clientId'].updateValueAndValidity();
    this.fieldForm.controls['expires'].updateValueAndValidity();
    this.fieldForm.controls['title'].updateValueAndValidity();
  }
  getQueryParam() {
    this.route.queryParams.subscribe(params => {
      if (params['userID']) {
        this.userID = params['userID'];
        this.initForm(params['userID']);
      } else {
        this.router.navigate(['/main/manage-users']);
      }

    })
  }
  submitForm(form: FormGroupDirective) {
    if (this.fieldForm.valid) {
      if (this.fieldForm.value.expires.day < 10) {
        this.fieldForm.value.expires.day = '0' + this.fieldForm.value.expires.day;
      }
      if (this.fieldForm.value.expires.month < 10) {
        this.fieldForm.value.expires.month = '0' + this.fieldForm.value.expires.month;
      }
      let formattedDate = `${this.fieldForm.value.expires.year}-${this.fieldForm.value.expires.month}-${this.fieldForm.value.expires.day}`
      this.fieldForm.value.expires = formattedDate;
      this.apiService.issueCertificate(this.fieldForm.value).subscribe(async res => {
        this.toastService.successToast('Certificate issued!');
        this.fieldForm.reset();
        form.resetForm();
        this.router.navigate(['main/manage-users']);
        this.fieldForm.patchValue({
          clientId: this.userID
        })

      }, error => {
        // console.log(error);
        this.toastService.errorToast('Something went wrong!');
      });
    }
  }

}
