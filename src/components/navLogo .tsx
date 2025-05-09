import logo from "../assets/logo.jpeg";

const Logo = () => {
   return (
      <img
         src={logo}
         alt="OpenCash Logo"
         className=" object-cover rounded-lg w-45 h-10"
      />
   );
};

export default Logo;
