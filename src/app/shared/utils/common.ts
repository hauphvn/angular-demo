import { ROLE_NEW_TYPE, userManagementRoleContants, userPolicies } from '@app/configs/app-constants';

export class CommonUtil {
  public static downloadFile(fileUrl: any): any {
    const fileLink = document.createElement('a');
    fileLink.href = fileUrl.url;
    document.body.appendChild(fileLink);
    fileLink.click();
    window.URL.revokeObjectURL(fileUrl.url);
  }
}
export class CheckUserPermission {
  static userPermission(nameFolder, userRole, projectIdActive= 0, userPoliciesData=[]) {
    let result = false;
    switch(nameFolder) {
      case ROLE_NEW_TYPE.ROLE_ADMIN:
        if (userRole.includes(userManagementRoleContants.USER_ROLE_ADMIN)) {
          result =  true;
        } else {
          result = false;
        }
        break;
      case ROLE_NEW_TYPE.ROLE_USER_XML_EDIT:
        result = getRoleUser(userRole, projectIdActive, userPolicies.XML_EDIT, userPoliciesData);
        break;
      case ROLE_NEW_TYPE.ROLE_USER_DATA_DL:
        result = getRoleUser(userRole, projectIdActive, userPolicies.DATA_DL, userPoliciesData);
        break;
      case ROLE_NEW_TYPE.ROLE_USER_PRO:
        result = getRoleUser(userRole, projectIdActive, userPolicies.PRO, userPoliciesData);
        break;
      case ROLE_NEW_TYPE.ROLE_USER_UPLOADER:
        result = getRoleUser(userRole, projectIdActive, userPolicies.UPLOADER, userPoliciesData);
        break;
      case ROLE_NEW_TYPE.ROLE_USER_STANDARD:
        result = getRoleUser(userRole, projectIdActive, userPolicies.STANDARD, userPoliciesData);
        break;
      case ROLE_NEW_TYPE.ROLE_USER_MINIMUM:
        result = getRoleUser(userRole, projectIdActive, userPolicies.MINIMUM, userPoliciesData);
        break;
    }
    return result;
  }

  static getRoleBaseByFolderId(projectIdActive, folderId, userPolicy) {
    const newHeaderPolicies = JSON.parse(JSON.stringify(userPolicy));
    return newHeaderPolicies.filter(item => item.project_id === projectIdActive && item.folder_id === folderId);
  }

  static getRoleBaseByProjectId(projectIdActive, userPolicy) {
    const newHeaderPolicies = JSON.parse(JSON.stringify(userPolicy));
    return newHeaderPolicies.filter(item => item.project_id === projectIdActive);
  }

  static getMaxPolicies(userPolicies, projectIdActive) {
    const listRolePolicies = [];
    const headerPolicies = [];
    userPolicies.filter(item => {
      if (item.project_id === projectIdActive) {
        item && item.policies && item.policies.filter(policy => {
          if (policy < 5) {
            listRolePolicies.push(policy);
          } else {
            headerPolicies.push(policy);
          }
        });
      }
    });
    listRolePolicies.sort(function(a, b) {
      return b - a;
    });
    let uniqueHeaderPolicies = [...new Set(headerPolicies)];
    return [listRolePolicies[0], ...uniqueHeaderPolicies]
  }

  static customHeaderPolicy(headerPolicy, userPolicy) {
    const newHeaderPolicies = JSON.parse(JSON.stringify(userPolicy));;
    if (newHeaderPolicies && newHeaderPolicies.length > 0) {
      newHeaderPolicies.filter(item => {
        item.policies = headerPolicy;
        return item;
      });
    }
    return newHeaderPolicies;
  }
}

function getRoleUser(userRole, projectIdActive, userPoliciesRole, userPoliciesData) {
  let result = false;
  if (userRole.includes(userManagementRoleContants.USER_ROLE_USER) && userPoliciesData && userPoliciesData.length > 0) {
    userPoliciesData.filter(item => {
      if (item.project_id === projectIdActive) {
        if (item.policies.includes(userPoliciesRole)) {
          result = true;
        }
      }
    });
  } else {
    result = false;
  }

  return result;
}
