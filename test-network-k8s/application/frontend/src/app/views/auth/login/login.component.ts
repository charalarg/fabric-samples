import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IInput } from 'idf-lib/lib/interfaces/i-input';
import { LocalStorageService } from 'ngx-webstorage';
import { AuthService } from 'src/app/services/auth.service';
import { RoleService } from 'src/app/services/role.service';
import { ToastsService } from 'src/app/services/toast.servive';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  viewLabel = 'Login'
  submitButtonLabel = 'Login';
  bgColor = '#fff';
  description = '';
  isDisabled: boolean = false;


  loginFields: Array<IInput> = [
    { id: 'userId', label: 'ID', value: '', placeholder: 'Enter your ID', errorMessage: '', validators: [Validators.required, Validators.maxLength(100)], required: true, type: 'text' },
    { id: 'password', label: 'Password', value: '', placeholder: 'Enter your password', errorMessage: '', validators: [Validators.required, Validators.maxLength(100)], required: true, type: 'password', }
  ]
  fieldForm!: FormGroup;
  isLoading: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private router: Router,
    private toastService: ToastsService,
    private roleService: RoleService
  ) { }

  ngOnInit() {
    // this.initForm();
  }

  ngAfterViewInit() {

  }

  // initForm() {
  //   this.fieldForm = this.formBuilder.group({}, { updateOn: 'change' });
  //   this.fieldForm.addControl('userId', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
  //   this.fieldForm.addControl('password', this.formBuilder.control('', [Validators.required, Validators.maxLength(100)]));
  //   this.fieldForm.controls['userId'].updateValueAndValidity();
  //   this.fieldForm.controls['password'].updateValueAndValidity();
  // }

  // submitForm() {
  //   if (this.fieldForm.valid) {
  //     this.authService.login(this.fieldForm.value).subscribe(async res => {
  //       console.log(res);
  //       if (res?.status) {
  //         await this.localStorage.store(environment.ACCESS_TOKEN, res?.token);
  //         this.router.navigate(['dashboard']);
  //       }
  //     });
  //   }
  // }
  getLoginValues(e: any) {
    this.isDisabled = true;
    this.authService.login(e).subscribe(async res => {
      console.log(res);
      if (res?.status) {
        this.isDisabled = false;
        this.toastService.successToast('Welcome!');
        await this.localStorage.store(environment.ACCESS_TOKEN, res?.token);
        await this.localStorage.store(environment.USER, this.parseJwt(res?.token));
        await this.localStorage.store(environment.ROLE, this.parseJwt(res?.token)?.role);
        await this.roleService.loadRole();
        this.router.navigate(['/main/dashboard']);
      }
    }, error => {
      // console.log(error);
      this.isDisabled = false;
      this.toastService.errorToast('Wrong credentials!');
    })

  }

  parseJwt(token: any) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  };
}

