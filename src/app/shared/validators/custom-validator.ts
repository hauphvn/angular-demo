import { messageConstant } from './../../configs/app-constants';
import { FormControl } from '@angular/forms';
import { ErrorMesage, RangeOperation, Operator, CustomErrorType } from './validation-model';
import { FormGroup } from '@angular/forms';

export class CustomValidator {
  static required(control: FormControl, max?: number): ErrorMesage {
    const msg = 'This field is required.';
    const value = control.value;
    if (value === null || value === undefined || value.length === 0) {
      return new ErrorMesage(CustomErrorType.REQUIRED, msg);
    } else if (typeof value === 'number') {
      return null;
    } else if (typeof value === 'string' && value.trim().length === 0) {
      return new ErrorMesage(CustomErrorType.REQUIRED, msg);
    } else {
      return null;
    }
  }

  static maxLength(max?: number) {
    return (control: FormControl): ErrorMesage => {
      if (`${control.value}`.length > max) {
        return new ErrorMesage(CustomErrorType.MAX_LENGTH, `Maximum length is ${max} characters.`);
      } else {
        return null;
      }
    };
  }

  static range(min: number, max: number) {
    return (control: FormControl): ErrorMesage => {
      if (control.value !== null && !isNaN(control.value)) {
        const num = parseInt(control.value, 10);
        if (num < min || num > max) {
          return new ErrorMesage(CustomErrorType.RANGE, `Input value must be in range from ${min} to ${max}.`);
        }
        return null;
      } else {
        return null;
      }
    };
  }

  static compare(source: string, targetControlName: string, op: Operator) {
    return (form: FormGroup): any => {
      const sourceVal = parseFloat(form.value[source]);
      const targetVal = parseFloat(form.value[targetControlName]);
      const targetControl = form.controls[source];

      if (sourceVal !== null && targetVal !== null && !isNaN(sourceVal) && !isNaN(targetVal)) {
        let isValid = true;
        switch (op.key) {
          case RangeOperation.GT.key: {
            isValid = sourceVal > targetVal;
            break;
          }
          case RangeOperation.LT.key: {
            isValid = sourceVal < targetVal;
            break;
          }
        }

        if (isValid) {
          if (targetControl.errors && targetControl.errors.type === CustomErrorType.COMPARE) {
            targetControl.setErrors(null);
            targetControl.updateValueAndValidity();
          }
          return form.errors;
        } else {
          targetControl.setErrors(
            new ErrorMesage(CustomErrorType.COMPARE, `Input value must be ${op.display} ${targetVal}.`)
          );
          return form.errors;
        }
      } else {
        return form.errors;
      }
    };
  }

  static unique(field: string) {
    return (control: FormControl): any => {
      if (!control.value || typeof control.value !== 'string' || control.value.trim().length === 0) {
        return null;
      }
      const duplicatedErr = new ErrorMesage(CustomErrorType.UNIQUE, `This field is duplicated.`);
      const currentVal: string = control.value;
      const group = control.parent;
      let isDuplicated = false;

      // check all validates
      Object.keys(group.controls).forEach(key => {
        if (key !== field) {
          const crt = group.get(key);
          if ((crt.value as string).trim().toLowerCase() === currentVal.trim().toLowerCase()) {
            isDuplicated = true;
            return;
          }
        }
      });

      if (isDuplicated) {
        control.setErrors(duplicatedErr);
        return control.errors;
      }

      return null;
    };
  }

  static positiveNumber(max?: number) {
    return (control: FormControl): ErrorMesage => {
      const msg = 'Positive number only';
      let value = control.value;
      if (`${value}`.match(/^-?\d*(\.\d+)?$/)) {
        value = parseFloat(value);
        // only number in string
        if (value < 0 || isNaN(value)) {
          // Number < 0
          return new ErrorMesage(CustomErrorType.POSITIVE_NUMBER, msg);
        } else {
          // custom reset value to max
          if (max && value > max) {
            control.setValue(max);
          }
          return null;
        }
      } else {
        return new ErrorMesage(CustomErrorType.POSITIVE_NUMBER, msg);
      }
    };
  }

  static validateTimeString(maxTimeString: string) {
    return (control: FormControl): ErrorMesage => {
      const values: string[] = control.value.split(':');
      for (const val of values) {
        if (val.includes('_')) {
          return new ErrorMesage(CustomErrorType.TIME_STRING_FORMAT, 'Wrong time format');
        }
      }
      const maxTimeValues = maxTimeString.split(':');
      const timeValueInSeconds = +values[0] * 3600 + +values[1] * 60 + +values[2];
      const maxTimeValueInSeconds = +maxTimeValues[0] * 3600 + +maxTimeValues[1] * 60 + +maxTimeValues[2];
      // only number in string
      if (timeValueInSeconds > maxTimeValueInSeconds) {
        return new ErrorMesage(CustomErrorType.TIME_STRING_FORMAT, `Max time in video is ${maxTimeString}`);
      }
      return null;
    };
  }

  static rangeControl(source: string, minControlName: string, maxControlName: string) {
    return (form: FormGroup): any => {
      const sourceVal = parseFloat(form.value[source]);
      const min = parseFloat(form.value[minControlName]);
      const max = parseFloat(form.value[maxControlName]);
      const targetControl = form.controls[source];

      if (sourceVal !== null && !isNaN(min) && !isNaN(max) && min < max) {
        if (sourceVal >= min && sourceVal <= max) {
          // Valid
          if (targetControl.errors && targetControl.errors.type === CustomErrorType.RANGE_CONTROL) {
            targetControl.setErrors(null);
            targetControl.updateValueAndValidity();
          }
        } else {
          targetControl.setErrors(null);
          targetControl.setErrors(
            new ErrorMesage(CustomErrorType.RANGE_CONTROL, `Input value must be in range from ${min} to ${max}.`)
          );
        }
      } else {
        targetControl.setErrors(null);
      }

      return form.errors;
    };
  }

  static email(control: FormControl): ErrorMesage {
    const msg = 'Wrong email format.';
    const value = control.value;
    if (value === null) {
      return null;
    } else {
      if (`${value}`.match(/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)) {
        return null;
      } else {
        return new ErrorMesage(CustomErrorType.EMAIL, msg);
      }
    }
  }

  static rangeLength(min: number, max: number) {
    return (control: FormControl): ErrorMesage => {
      if (control.value !== null) {
        const length = control.value.length;
        if (length < min || length > max) {
          return new ErrorMesage(CustomErrorType.RANGE_LENGTH, `Length must be in range from ${min} to ${max}.`);
        }
        return null;
      } else {
        return null;
      }
    };
  }

  static rangeLengthExceptNone(min: number, max: number) {
    return (control: FormControl): ErrorMesage => {
      if (control.value !== null && control.value.length !== 0) {
        const length = control.value.length;
        if (length < min || length > max) {
          return new ErrorMesage(CustomErrorType.RANGE_LENGTH, `Length must be in range from ${min} to ${max}.`);
        }
        return null;
      } else {
        return null;
      }
    };
  }

  // static checkSpecialCharacter(control: FormControl, customMessage?: string): ErrorMesage {
  //   const msg = messageConstant.VALIDATOR.SPECIAL_CHARACTER;
  //   const value = control.value;
  //   if (!value) {
  //     return null;
  //   } else {
  //     const regex = value.toString().match(/([\\{\^}%`\]>[~<#|])+/g);
  //     if (!regex || regex.length === 0) {
  //       return null;
  //     } else {
  //       return new ErrorMesage(CustomErrorType.CHARACTER, msg);
  //     }
  //   }
  // }

  static matchField(sourceFieldName, matchFieldName) {
    return (formGroup: FormGroup) => {
      const sourceControl = formGroup.controls[sourceFieldName];
      const matchControl = formGroup.controls[matchFieldName];

      if (matchControl.errors && matchControl.errors.type !== CustomErrorType.MATH_PASSWORD) {
        // Error in another validator
        return;
      }

      if (sourceControl.value !== matchControl.value) {
        matchControl.setErrors(
          new ErrorMesage(CustomErrorType.MATH_PASSWORD, `New password and confirm password don't match`)
        );
        return formGroup.errors;
      } else {
        matchControl.setErrors(null);
        sourceControl.setErrors(null);
        return formGroup.errors;
      }
    };
  }

  static checkSpecialCharacter(customMessage?: string) {
    return (control: FormControl): ErrorMesage => {
      const msg = customMessage || messageConstant.VALIDATOR.SPECIAL_CHARACTER;
      const value = control.value;
      if (!value) {
        return null;
      } else {
        const regex = value.toString().match(/([\\{\^}%`\]>[~<#|])+/g);
        if (!regex || regex.length === 0) {
          return null;
        } else {
          return new ErrorMesage(CustomErrorType.CHARACTER, msg);
        }
      }
    };
  }
}
